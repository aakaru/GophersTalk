package main

import (
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"sync"
)

type Client struct {
	conn     *websocket.Conn
	username string
	send     chan []byte
}
type Chatserver struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mutex      sync.Mutex
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func newChatserver() *Chatserver {
	return &Chatserver{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (server *Chatserver) Run() {
	for {
		select {
		case client := <-server.register:
			server.mutex.Lock()
			server.clients[client] = true
			server.mutex.Unlock()
			msg := fmt.Sprintf("User %s joined the chat.", client.username)
			server.broadcast <- []byte(msg)
			log.Printf("New client registered: %s", client.username)

		case client := <-server.unregister:
			server.mutex.Lock()
			if _, ok := server.clients[client]; ok {
				delete(server.clients, client)
				close(client.send)
				msg := fmt.Sprintf("User %s left the chat.", client.username)
				server.broadcast <- []byte(msg)
			}
			server.mutex.Unlock()
			log.Printf("Client uregistered: %s", client.username)

		case message := <-server.broadcast:
			server.mutex.Lock()
			for client := range server.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(server.clients, client)
				}
			}
			server.mutex.Unlock()
		}
	}
}

func (server *Chatserver) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection: ", err)
		return
	}
	username := r.URL.Query().Get("username")
	if username == "" {
		username = "Anonymous"
	}
	client := &Client{
		conn:     conn,
		username: username,
		send:     make(chan []byte, 256),
	}
	server.register <- client

	go client.writePump(server)
	go client.readPump(server)
}

func (client *Client) readPump(server *Chatserver) {
	defer func() {
		server.unregister <- client
		client.conn.Close()
	}()

	for {
		_, message, err := client.conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message: ", err)
			break
		}
		formattedMessage := fmt.Sprintf("%s: %s", client.username, message)
		server.broadcast <- []byte(formattedMessage)
	}

}

func (client *Client) writePump(server *Chatserver) {
	defer client.conn.Close()

	for {
		message, ok := <-client.send
		if !ok {
			client.conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}
		err := client.conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("Error writing message: %v", err)
			return
		}
	}
}

func main() {
	server := newChatserver()
	go server.Run()

	http.Handle("/", http.FileServer(http.Dir("./static/")))
	http.HandleFunc("/ws", server.HandleWebSocket)

	port := ":8080"
	log.Printf("Server starting on  %s", port)
	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
