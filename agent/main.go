package main

import (
	"encoding/json"
	"log"
	"net/http"
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
		Version: "1.0.0",
	})
}

func main() {
	http.HandleFunc("/health", health)
	log.Println("BilloreCloud Agent running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
