package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Models
type Hadith struct {
	ID          uint        `json:"id" gorm:"primaryKey"`
	Text        string      `json:"text" gorm:"not null"`
	Companions  []Companion `json:"companions" gorm:"many2many:hadith_companions;"`
	Sources     []Source    `json:"sources" gorm:"many2many:hadith_sources;"`
}

type Companion struct {
	ID   uint   `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"unique;not null"`
}

type Source struct {
	ID   uint   `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"unique;not null"`
}

// Request/Response types
type CreateHadithRequest struct {
	Text         string `json:"text"`
	CompanionIDs []uint `json:"companion_ids"`
	SourceIDs    []uint `json:"source_ids"`
}

type QuizQuestion struct {
	ID          uint        `json:"id"`
	Text        string      `json:"text"`
	Type        string      `json:"type"` // "multiple_choice" or "fill_blanks"
	Companions  []Companion `json:"companions,omitempty"`
	Sources     []Source    `json:"sources,omitempty"`
	BlankText   string      `json:"blank_text,omitempty"`
	BlankWords  []string    `json:"blank_words,omitempty"`
	BlankIndices []int      `json:"blank_indices,omitempty"` // Store which positions were blanked
}

type CheckAnswerRequest struct {
	HadithID         uint     `json:"hadith_id"`
	QuestionType     string   `json:"question_type"`
	CompanionIDs     []uint   `json:"companion_ids,omitempty"`
	SourceIDs        []uint   `json:"source_ids,omitempty"`
	FilledWords      []string `json:"filled_words,omitempty"`
	BlankIndices     []int    `json:"blank_indices,omitempty"` // Which positions were blanked
}

type CheckAnswerResponse struct {
	IsCorrect bool `json:"is_correct"`
}

type GetCorrectAnswerResponse struct {
	CorrectCompanions []Companion `json:"correct_companions"`
	CorrectSources    []Source    `json:"correct_sources"`
	CorrectWords      []string    `json:"correct_words,omitempty"`
	FullText          string      `json:"full_text"`
}

var db *gorm.DB

func main() {
	// Initialize random seed
	rand.Seed(time.Now().UnixNano())
	
	// Initialize database
	var err error
	db, err = gorm.Open(sqlite.Open("hadith.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Migrate the schema
	db.AutoMigrate(&Hadith{}, &Companion{}, &Source{})

	// Setup routes
	router := mux.NewRouter()
	
	// API routes
	api := router.PathPrefix("/api").Subrouter()
	
	// Hadith routes
	api.HandleFunc("/hadiths", getHadiths).Methods("GET")
	api.HandleFunc("/hadiths", createHadith).Methods("POST")
	api.HandleFunc("/hadiths/{id}", getHadith).Methods("GET")
	
	// Companion routes
	api.HandleFunc("/companions", getCompanions).Methods("GET")
	api.HandleFunc("/companions", createCompanion).Methods("POST")
	
	// Source routes
	api.HandleFunc("/sources", getSources).Methods("GET")
	api.HandleFunc("/sources", createSource).Methods("POST")
	
	// Quiz routes
	api.HandleFunc("/quiz/random", getRandomQuiz).Methods("GET")
	api.HandleFunc("/quiz/check", checkAnswer).Methods("POST")
	api.HandleFunc("/quiz/answer/{id}", getCorrectAnswer).Methods("GET")
	
	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		Debug:           true, // Enable debug mode to see CORS logs
	})

	handler := c.Handler(router)
	
	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

// Hadith handlers
func getHadiths(w http.ResponseWriter, r *http.Request) {
	var hadiths []Hadith
	db.Preload("Companions").Preload("Sources").Find(&hadiths)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hadiths)
}

func createHadith(w http.ResponseWriter, r *http.Request) {
	var req CreateHadithRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hadith := Hadith{Text: req.Text}
	
	// Find companions
	if len(req.CompanionIDs) > 0 {
		db.Where("id IN ?", req.CompanionIDs).Find(&hadith.Companions)
	}
	
	// Find sources
	if len(req.SourceIDs) > 0 {
		db.Where("id IN ?", req.SourceIDs).Find(&hadith.Sources)
	}
	
	db.Create(&hadith)
	db.Preload("Companions").Preload("Sources").First(&hadith, hadith.ID)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hadith)
}

func getHadith(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	
	var hadith Hadith
	if err := db.Preload("Companions").Preload("Sources").First(&hadith, id).Error; err != nil {
		http.Error(w, "Hadith not found", http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hadith)
}

// Companion handlers
func getCompanions(w http.ResponseWriter, r *http.Request) {
	var companions []Companion
	db.Find(&companions)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(companions)
}

func createCompanion(w http.ResponseWriter, r *http.Request) {
	var companion Companion
	if err := json.NewDecoder(r.Body).Decode(&companion); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	db.Create(&companion)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(companion)
}

// Source handlers
func getSources(w http.ResponseWriter, r *http.Request) {
	var sources []Source
	db.Find(&sources)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sources)
}

func createSource(w http.ResponseWriter, r *http.Request) {
	var source Source
	if err := json.NewDecoder(r.Body).Decode(&source); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	db.Create(&source)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(source)
}

// Quiz handlers
func getRandomQuiz(w http.ResponseWriter, r *http.Request) {
	var hadiths []Hadith
	db.Preload("Companions").Preload("Sources").Find(&hadiths)
	
	if len(hadiths) == 0 {
		http.Error(w, "No hadiths found", http.StatusNotFound)
		return
	}
	
	// Get question types from query parameter
	allowedTypes := r.URL.Query().Get("types")
	var questionTypes []string
	
	if allowedTypes != "" {
		// Parse comma-separated types
		requestedTypes := strings.Split(allowedTypes, ",")
		for _, t := range requestedTypes {
			t = strings.TrimSpace(t)
			if t == "multiple_choice" || t == "fill_blanks" {
				questionTypes = append(questionTypes, t)
			}
		}
	}
	
	// Default to both types if none specified or invalid
	if len(questionTypes) == 0 {
		questionTypes = []string{"multiple_choice", "fill_blanks"}
	}
	
	// Get all companions and sources for multiple choice
	var allCompanions []Companion
	var allSources []Source
	db.Find(&allCompanions)
	db.Find(&allSources)
	
	// Randomly select a hadith and question type
	randomHadithIndex := rand.Intn(len(hadiths))
	hadith := hadiths[randomHadithIndex]
	
	randomQuestionIndex := rand.Intn(len(questionTypes))
	questionType := questionTypes[randomQuestionIndex]
	
	quiz := QuizQuestion{
		ID:   hadith.ID,
		Text: hadith.Text,
		Type: questionType,
	}
	
	if questionType == "multiple_choice" {
		quiz.Companions = allCompanions
		quiz.Sources = allSources
	} else if questionType == "fill_blanks" {
		// Create blanked version of text with truly random blank positions
		words := strings.Fields(hadith.Text)
		if len(words) > 5 {
			// Randomly select 2-4 words to blank out
			numBlanks := 2 + rand.Intn(3) // Random number between 2-4
			if numBlanks > len(words)-2 {
				numBlanks = len(words) - 2 // Don't blank out more than total-2 words
			}
			
			// Generate random indices for blanks (avoid first and last word)
			availableIndices := make([]int, len(words)-2)
			for i := 1; i < len(words)-1; i++ {
				availableIndices[i-1] = i
			}
			
			// Shuffle and select random indices
			for i := len(availableIndices) - 1; i > 0; i-- {
				j := rand.Intn(i + 1)
				availableIndices[i], availableIndices[j] = availableIndices[j], availableIndices[i]
			}
			
			blankIndices := availableIndices[:numBlanks]
			
			var blankWords []string
			var blankedWords []string
			
			for i, word := range words {
				shouldBlank := false
				for _, idx := range blankIndices {
					if i == idx {
						shouldBlank = true
						break
					}
				}
				
				if shouldBlank {
					blankWords = append(blankWords, word)
					blankedWords = append(blankedWords, "____")
				} else {
					blankedWords = append(blankedWords, word)
				}
			}
			
			quiz.BlankText = strings.Join(blankedWords, " ")
			quiz.BlankWords = blankWords
			quiz.BlankIndices = blankIndices
		}
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(quiz)
}

// Check answer handler
func checkAnswer(w http.ResponseWriter, r *http.Request) {
	var req CheckAnswerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Find the hadith with correct answers
	var hadith Hadith
	if err := db.Preload("Companions").Preload("Sources").First(&hadith, req.HadithID).Error; err != nil {
		http.Error(w, "Hadith not found", http.StatusNotFound)
		return
	}

	var response CheckAnswerResponse

	if req.QuestionType == "multiple_choice" {
		// Check companions and sources
		correctCompanionIDs := make([]uint, len(hadith.Companions))
		for i, c := range hadith.Companions {
			correctCompanionIDs[i] = c.ID
		}

		correctSourceIDs := make([]uint, len(hadith.Sources))
		for i, s := range hadith.Sources {
			correctSourceIDs[i] = s.ID
		}

		// Sort arrays for comparison
		companionsMatch := arraysEqual(sortUintArray(req.CompanionIDs), sortUintArray(correctCompanionIDs))
		sourcesMatch := arraysEqual(sortUintArray(req.SourceIDs), sortUintArray(correctSourceIDs))

		response.IsCorrect = companionsMatch && sourcesMatch

	} else if req.QuestionType == "fill_blanks" {
		// For fill_blanks, use the provided blank indices to get correct words
		words := strings.Fields(hadith.Text)
		if len(words) > 5 && len(req.BlankIndices) > 0 {
			var correctWords []string
			for _, idx := range req.BlankIndices {
				if idx < len(words) {
					correctWords = append(correctWords, words[idx])
				}
			}

			// Compare user input (case insensitive)
			userWords := make([]string, len(req.FilledWords))
			for i, word := range req.FilledWords {
				userWords[i] = strings.ToLower(strings.TrimSpace(word))
			}

			correctWordsLower := make([]string, len(correctWords))
			for i, word := range correctWords {
				correctWordsLower[i] = strings.ToLower(word)
			}

			response.IsCorrect = arraysEqualString(userWords, correctWordsLower)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Get correct answer handler
func getCorrectAnswer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Find the hadith with correct answers
	var hadith Hadith
	if err := db.Preload("Companions").Preload("Sources").First(&hadith, id).Error; err != nil {
		http.Error(w, "Hadith not found", http.StatusNotFound)
		return
	}

	// Get question type from query parameter
	questionType := r.URL.Query().Get("type")
	
	response := GetCorrectAnswerResponse{
		FullText:          hadith.Text,
		CorrectCompanions: hadith.Companions,
		CorrectSources:    hadith.Sources,
	}

	// If it's fill_blanks type, get blank indices from query parameter
	if questionType == "fill_blanks" {
		blankIndicesStr := r.URL.Query().Get("blank_indices")
		if blankIndicesStr != "" {
			words := strings.Fields(hadith.Text)
			var blankIndices []int
			
			// Parse comma-separated indices
			indicesStr := strings.Split(blankIndicesStr, ",")
			for _, idxStr := range indicesStr {
				if idx, err := strconv.Atoi(strings.TrimSpace(idxStr)); err == nil {
					blankIndices = append(blankIndices, idx)
				}
			}
			
			var correctWords []string
			for _, idx := range blankIndices {
				if idx < len(words) {
					correctWords = append(correctWords, words[idx])
				}
			}
			response.CorrectWords = correctWords
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Helper functions
func arraysEqual(a, b []uint) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func arraysEqualString(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func sortUintArray(arr []uint) []uint {
	sorted := make([]uint, len(arr))
	copy(sorted, arr)
	// Simple bubble sort for small arrays
	for i := 0; i < len(sorted); i++ {
		for j := 0; j < len(sorted)-1-i; j++ {
			if sorted[j] > sorted[j+1] {
				sorted[j], sorted[j+1] = sorted[j+1], sorted[j]
			}
		}
	}
	return sorted
}
