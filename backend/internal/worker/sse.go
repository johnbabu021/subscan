package worker

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/google/uuid"
)

type SSEManager struct {
	clients map[uuid.UUID]map[chan string]struct{}
	mu      sync.RWMutex
}

var sseManager *SSEManager

func NewSSEManager() *SSEManager {
	return &SSEManager{
		clients: make(map[uuid.UUID]map[chan string]struct{}),
	}
}

func InitSSE() {
	sseManager = NewSSEManager()
}

func GetSSEManager() *SSEManager {
	return sseManager
}

func (m *SSEManager) Subscribe(scanID uuid.UUID) chan string {
	ch := make(chan string, 100)
	m.mu.Lock()
	if m.clients[scanID] == nil {
		m.clients[scanID] = make(map[chan string]struct{})
	}
	m.clients[scanID][ch] = struct{}{}
	m.mu.Unlock()
	return ch
}

func (m *SSEManager) Unsubscribe(scanID uuid.UUID, ch chan string) {
	m.mu.Lock()
	if m.clients[scanID] != nil {
		delete(m.clients[scanID], ch)
		if len(m.clients[scanID]) == 0 {
			delete(m.clients, scanID)
		}
	}
	m.mu.Unlock()
	close(ch)
}

func (m *SSEManager) Send(scanID uuid.UUID, subdomain string) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if clients, ok := m.clients[scanID]; ok {
		data, _ := json.Marshal(map[string]string{
			"subdomain": subdomain,
			"type":      "found",
		})
		message := fmt.Sprintf("data: %s\n\n", data)
		for ch := range clients {
			select {
			case ch <- message:
			default:
				// Channel full, skip
			}
		}
	}
}

func (m *SSEManager) SendStatus(scanID uuid.UUID, status string) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if clients, ok := m.clients[scanID]; ok {
		data, _ := json.Marshal(map[string]string{
			"status": status,
			"type":   "status",
		})
		message := fmt.Sprintf("data: %s\n\n", data)
		for ch := range clients {
			select {
			case ch <- message:
			default:
			}
		}
	}
}