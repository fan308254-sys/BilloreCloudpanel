package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type Health struct {
	Success bool   `json:"success"`
	Agent   string `json:"agent"`
	Status  string `json:"status"`
	Version string `json:"version"`
}

func health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(Health{
		Success: true,
		Agent:   "BilloreCloud Node Agent",
		Status:  "online",
		Version: "1.0.1",
	})
}

func main() {
	port := os.Getenv("AGENT_PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/health", health)
	log.Printf("BilloreCloud Agent running on http://0.0.0.0:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
