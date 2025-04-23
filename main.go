package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from our frontend development server
		origin := r.Header.Get("Origin")
		// Add other allowed origins if needed (e.g., your production frontend URL)
		return origin == "http://localhost:3000" || origin == "http://localhost:3001"
	},
}

// Client represents a single connected user
type Client struct {
	ID       string
	Username string
	Conn     *websocket.Conn
	Hub      *Hub
	// send     chan []byte // Removed: Using direct writes with mutex for simplicity here
}

// Hub maintains the set of active clients and broadcasts messages.
type Hub struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte // Channel for broadcasting regular messages
	mutex      sync.RWMutex
}

// Message defines the structure for messages exchanged via WebSocket
type Message struct {
	Username  string `json:"username"`
	Text      string `json:"text"`
	Timestamp int64  `json:"timestamp"`
	Type      string `json:"type"` // "message", "system", "users"
}

// newHub creates a new Hub.
func newHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte, 256), // Buffered channel
	}
}

// broadcastMessage sends a message to all connected clients, optionally excluding one.
func (h *Hub) broadcastMessage(message []byte, exclude *Client) {
	h.mutex.RLock()
	defer h.mutex.RUnlock() // Ensure mutex is unlocked even if errors occur

	clientCount := 0
	for client := range h.clients {
		if client == exclude {
			continue
		}
		err := client.Conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("Error writing message to client %s: %v. Removing client.", client.Username, err)
			// Don't call unregister directly here to avoid deadlock
			// Let the readPump handle the disconnection detection
			client.Conn.Close() // Close the connection immediately
			// We can't directly remove from map while iterating,
			// The failed write will likely cause readPump to exit and unregister
		} else {
			clientCount++
		}
	}
	// Only log if the message wasn't specifically the user list (to avoid log spam)
	var msgData map[string]interface{}
	if json.Unmarshal(message, &msgData) == nil && msgData["type"] != "users" {
		log.Printf("Broadcasted message to %d clients: %s", clientCount, string(message))
	}
}

// sendUsersList generates the user list and broadcasts it.
func (h *Hub) sendUsersList() {
	h.mutex.RLock()
	userList := make([]string, 0, len(h.clients))
	for client := range h.clients {
		userList = append(userList, client.Username)
	}
	clientCount := len(h.clients)
	h.mutex.RUnlock() // Unlock before marshalling and broadcasting

	log.Printf("Sending updated user list: %v (total: %d)", userList, clientCount)

	usersMsg := struct {
		Type  string   `json:"type"`
		Users []string `json:"users"`
	}{
		Type:  "users",
		Users: userList,
	}

	msgBytes, err := json.Marshal(usersMsg)
	if err != nil {
		log.Printf("Error marshalling user list: %v", err)
		return
	}

	// Broadcast the user list to all clients
	h.broadcastMessage(msgBytes, nil)
}

// run starts the hub's event loop.
func (h *Hub) run() {
	log.Println("Hub started")
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			clientCount := len(h.clients)
			h.mutex.Unlock()
			log.Printf("Client registered: %s (Total: %d)", client.Username, clientCount)

			// Send system message: user joined
			joinMsg := Message{
				Username:  "System",
				Text:      fmt.Sprintf("%s joined the chat", client.Username),
				Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
				Type:      "system",
			}
			joinMsgBytes, _ := json.Marshal(joinMsg)
			h.broadcastMessage(joinMsgBytes, nil) // Broadcast join message to all

			// Send updated user list to all clients
			h.sendUsersList()

		case client := <-h.unregister:
			h.mutex.Lock()
			wasPresent := false
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				// Ensure connection is closed
				client.Conn.Close()
				wasPresent = true
				log.Printf("Client unregistered: %s (Remaining: %d)", client.Username, len(h.clients))
			}
			h.mutex.Unlock()

			if wasPresent {
				// Send system message: user left
				leaveMsg := Message{
					Username:  "System",
					Text:      fmt.Sprintf("%s left the chat", client.Username),
					Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
					Type:      "system",
				}
				leaveMsgBytes, _ := json.Marshal(leaveMsg)
				h.broadcastMessage(leaveMsgBytes, nil) // Broadcast leave message

				// Send updated user list to all clients
				h.sendUsersList()
			} else {
				log.Printf("Attempted to unregister client %s, but not found.", client.Username)
			}

		case message := <-h.broadcast:
			// This channel is now primarily for chat messages from clients
			h.broadcastMessage(message, nil)
		}
	}
}

// readPump pumps messages from the WebSocket connection to the hub's broadcast channel.
func (c *Client) readPump() {
	defer func() {
		log.Printf("Client %s readPump exiting, triggering unregister", c.Username)
		c.Hub.unregister <- c
		// The hub's run loop will handle closing the connection
	}()

	// Optional: Set connection limits and handlers
	// c.Conn.SetReadLimit(maxMessageSize)
	// c.Conn.SetReadDeadline(time.Now().Add(pongWait)) // Example pong timeout
	// c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		messageType, message, err := c.Conn.ReadMessage()
		if err != nil {
			// Log different types of errors
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf("Unexpected close error for client %s: %v", c.Username, err)
			} else if e, ok := err.(*websocket.CloseError); ok {
				log.Printf("Client %s connection closed normally: %v", c.Username, e)
			} else {
				log.Printf("Error reading from client %s: %v", c.Username, err)
			}
			break // Exit loop on any error or normal close
		}

		if messageType == websocket.TextMessage {
			log.Printf("Received raw message from %s: %s", c.Username, string(message))

			// Validate the message is valid JSON
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Invalid JSON received from %s: %v. Message: %s", c.Username, err, string(message))
				continue // Ignore invalid JSON
			}

			// Basic validation: Ensure username matches the connection's username
			// This prevents a client from spoofing messages from other users
			if msg.Username != c.Username {
				log.Printf("Message username mismatch for client %s. Expected '%s', got '%s'", c.Username, c.Username, msg.Username)
				continue // Ignore message with incorrect username
			}

			// Ensure the message type is 'message' before broadcasting
			if msg.Type == "message" {
				// Make sure timestamp is set (client might not always send it)
				if msg.Timestamp == 0 {
					msg.Timestamp = time.Now().UnixNano() / int64(time.Millisecond)
					// Re-marshal if we modified the message
					message, err = json.Marshal(msg)
					if err != nil {
						log.Printf("Error re-marshalling message from %s: %v", c.Username, err)
						continue
					}
				}

				// Send the validated (and potentially timestamped) message bytes to the hub
				c.Hub.broadcast <- message
			} else {
				log.Printf("Client %s attempted to send non-message type: %s", c.Username, msg.Type)
				// Decide how to handle invalid message types (e.g., ignore, disconnect client)
			}
		} else {
			log.Printf("Received non-text message type %d from %s", messageType, c.Username)
			// Handle binary messages or other types if needed, otherwise ignore or disconnect client
		}
	}
}

// serveWs handles websocket requests from the peer.
func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil) // Upgrade handles CORS check via CheckOrigin
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}

	username := r.URL.Query().Get("username")
	if username == "" {
		username = fmt.Sprintf("User_%d", time.Now().UnixNano()%10000) // Make default more unique
		log.Printf("Username not provided, assigning default: %s", username)
	}

	client := &Client{
		ID:       username + "-" + fmt.Sprintf("%d", time.Now().UnixNano()),
		Username: username,
		Conn:     conn,
		Hub:      hub,
	}

	log.Printf("New client trying to register: %s (ID: %s)", username, client.ID)

	// Register client with the hub
	hub.register <- client

	// Start the readPump in a new goroutine.
	// It will handle reading messages and triggering unregister on error/close.
	go client.readPump()

	// Note: We don't typically need a writePump here if all writes
	// are managed by the hub's broadcast mechanism. If direct client-specific
	// writes were needed frequently, a writePump per client would be better.
}

func main() {
	hub := newHub()
	go hub.run()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// CORS is handled by the upgrader's CheckOrigin function now.
		// Preflight OPTIONS requests are implicitly handled by the default server mux.
		serveWs(hub, w, r)
	})

	port := ":8080"
	fmt.Printf("Starting WebSocket server on http://localhost%s\n", port)
	fmt.Println("Use Ctrl+C to stop the server")
	fmt.Println("WebSocket endpoint: ws://localhost:8080/ws?username=yourname")

	// Use http.Server for better control, e.g., setting timeouts later
	server := &http.Server{
		Addr:              port,
		ReadHeaderTimeout: 3 * time.Second,
	}
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("ListenAndServe Error:", err)
	}
}
