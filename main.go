package main

import (
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/ragulmuthukumar1/usermanagement/static"
)

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Age   int    `json:"age"`
	Email string `json:"email"`
}

var users []User
var nextUserID = 1

func main() {
	r := mux.NewRouter()

	// API endpoints
	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/users", handleAPIUsers).Methods("GET")
	api.HandleFunc("/users", handleAPICreateUser).Methods("POST")
	api.HandleFunc("/users/{id}", handleAPIGetUser).Methods("GET")
	api.HandleFunc("/users/{id}", handleAPIUpdateUser).Methods("PUT")
	api.HandleFunc("/users/{id}", handleAPIDeleteUser).Methods("DELETE")


	r.PathPrefix("/").Handler(http.FileServer(http.FS(static.FS)))

	// Start server
	port := 8040
	log.Printf("Server listening on port %d...\n", port)
	log.Fatal(http.ListenAndServe(":"+strconv.Itoa(port), r))
}

// API handlers

func handleAPIUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func handleAPICreateUser(w http.ResponseWriter, r *http.Request) {
	var newUser User
	err := json.NewDecoder(r.Body).Decode(&newUser)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// Validate user input
	if newUser.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	if newUser.Age <= 18 {
		http.Error(w, "Age must be above 18", http.StatusBadRequest)
		return
	}

	// Basic email format validation
	if !isValidEmail(newUser.Email) {
		http.Error(w, "Invalid email format", http.StatusBadRequest)
		return
	}

	// Check if email already exists
	for _, user := range users {
		if user.Email == newUser.Email {
			http.Error(w, "Email already exists", http.StatusConflict)
			return
		}
	}

	newUser.ID = nextUserID
	nextUserID++
	users = append(users, newUser)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newUser)
}

func handleAPIGetUser(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	userID, err := strconv.Atoi(params["id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	for _, user := range users {
		if user.ID == userID {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(user)
			return
		}
	}

	http.Error(w, "User not found", http.StatusNotFound)
}

func handleAPIUpdateUser(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	userID, err := strconv.Atoi(params["id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var updatedUser User
	err = json.NewDecoder(r.Body).Decode(&updatedUser)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// Validate user input
	if updatedUser.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	if updatedUser.Age <= 18 {
		http.Error(w, "Age must be above 18", http.StatusBadRequest)
		return
	}

	// Basic email format validation
	if !isValidEmail(updatedUser.Email) {
		http.Error(w, "Invalid email format", http.StatusBadRequest)
		return
	}

	// Find and update user
	for i := range users {
		if users[i].ID == userID {
			users[i] = updatedUser
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(updatedUser)
			return
		}
	}

	http.Error(w, "User not found", http.StatusNotFound)
}

func handleAPIDeleteUser(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	userID, err := strconv.Atoi(params["id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	for i, user := range users {
		if user.ID == userID {
			users = append(users[:i], users[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "User not found", http.StatusNotFound)
}

// Utility function to validate email format using regex
func isValidEmail(email string) bool {
	// Basic email format validation
	// This regex pattern allows common email formats, but it's not exhaustive
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}
