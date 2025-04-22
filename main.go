package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"
)

type Event struct {
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"created_ar"`
	Actor     struct {
		Login string `json:"login"`
	} `json:"actor"`
	Repo struct {
		Name string `json:"name"`
	} `json:"repo"`
	Payload json.RawMessage `json:"payload"`
}

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: github-activity <username>")
		os.Exit(1)
	}

	username := os.Args[1]
	events, err := fetchUserEvents(username)
	if err != nil {
		fmt.Errorf("Error: %s\n", err)
		os.Exit(1)
	}
	displayEvents(events)
}

func fetchUserEvents(username string) ([]Event, error) {
	url := fmt.Sprintf("https://api.github.com/users/%s/events", username)
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("Error creating request: %w", err)
	}
	req.Header.Set("User-Agent", "GitHub-User-Activity-CLI")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Failed to fetch data : %w, err")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, fmt.Errorf("User %s not found", username)
		}
		return nil, fmt.Errorf("Github API returned status %s", resp.StatusCode)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Error reading response: %w", err)
	}
	var events []Event
	if err := json.Unmarshal(body, &events); err != nil {
		return nil, fmt.Errorf("error parsing JSON: %w", err)
	}

	return events, nil
}

func displayEvents(events []Event) {
	if len(events) == 0 {
		return
	}
	fmt.Println("Recent Github Activity: ")
	fmt.Println("-----------------------")
	for i, event := range events {
		if i >= 10 {
			break
		}
		timeStr := event.CreatedAt.Format("Jan 02, 2006 15:04")
		description := getEventDescription(event)
		fmt.Printf("[%s] %s\n", timeStr, description)
	}
}

func getEventDescription(event Event) string {
	switch event.Type {
	case "PushEvent":
		return fmt.Sprintf("%s pushed to %s", event.Actor.Login, event.Repo.Name)
	case "CreateEvent":
		return fmt.Sprintf("%s pushed to %s", event.Actor.Login, event.Repo.Name)
	case "IssuesEvent":
		return fmt.Sprintf("%s updated an issue in %s", event.Actor.Login, event.Repo.Name)
	case "PullRequestEvent":
		return fmt.Sprintf("%s updated a pull request in %s", event.Actor.Login, event.Repo.Name)
	case "IssueCommentEvent":
		return fmt.Sprintf("%s commented on an issue in %s", event.Actor.Login, event.Repo.Name)
	case "WatchEvent":
		return fmt.Sprintf("%s starred %s", event.Actor.Login, event.Repo.Name)
	case "ForkEvent":
		return fmt.Sprintf("%s forked %s", event.Actor.Login, event.Repo.Name)
	case "DeletionEvent":
		return fmt.Sprintf("%s deleted something in %s", event.Actor.Login, event.Repo.Name)
	case "CommitCommentEvent":
		return fmt.Sprintf("%s commented on a commit in %s", event.Actor.Login, event.Repo.Name)
	default:
		return fmt.Sprintf("%s performed %s on %s", event.Actor.Login, event.Type, event.Repo.Name)
	}
}
