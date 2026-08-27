package config

import "os"

func Port() string {
	if value := os.Getenv("AGENT_PORT"); value != "" {
		return value
	}
	return "8080"
}
