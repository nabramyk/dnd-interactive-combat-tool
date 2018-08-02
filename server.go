package main

import (
	"log"
	"net/http"

	"github.com/googollee/go-socket.io"
)

type GridSpace struct {
	elementIdCounter int
	annotationsIdCounter int
	id int
	//history []
	elements []Element
	annotations []string
	width int
	height int
	name string
}

func (gs GridSpace) resizeWidth(width int) {
	gs.width = width
}

func (gs GridSpace) resizeHeight(height int) {
	gs.height = height
}

func (gs GridSpace) findElementById(x int, y int) {}
func (gs GridSpace) hasElementAtPosition(x int, y int) {}
func (gs GridSpace) generateRandomBoardElements() {}

func (gs GridSpace) addElementToGridSpace(x int, y int, size int, shape string, color string, category string, name string) {
	gs.elements = append(gs.elements, Element{id : gs.elementIdCounter, x : x, y : y, size : size, shape : shape, color : color, category : category, name : name, space : &gs.elements})
}

func (gs GridSpace) addAnnotationToGridSpace(el Element) {}
func (gs GridSpace) removeElementFromGridSpace(id int) {}
func (gs GridSpace) removeAnnotationFromGridSpace(id int) {}
func (gs GridSpace) removeAllElementsFromGridSpace() {}
func (gs GridSpace) nudgeElement(x int, y int, direction string) {}
func (gs GridSpace) warpElement(originX int, originY int, destX int, destY int) {}
func (gs GridSpace) gatherElementsWithinRegion() {}

type Element struct {
	id int
	x int
	y int
	size int
	shape string
	color string
	category string
	name string
	space *[]Element
}

func (el Element) nudge(direction string) {}
func (el Element) warp(x int, y int) {}
func (el Element) mutate(modifiedElement Element) {}
func (el Element) collide(x int, y int, size int, id int) bool {
	return true
}
func (el Element) within(x int, y int) bool {
	return true
}

var GridSpaces []GridSpace
var el Element

func main() {
	server, err := socketio.NewServer(nil)
	if err != nil {
		log.Fatal(err)
	}
	server.On("connection", func(so socketio.Socket) {
		log.Println("on connection")
		so.On("chat", func(msg string) {
			log.Println(msg)
			log.Println("emit:", so.Emit("chat message", msg))
			so.BroadcastTo("chat", "chat message", msg)
		})
		so.On("disconnection", func() {
			log.Println("on disconnect")
		})
	})
	server.On("error", func(so socketio.Socket, err error) {
		log.Println("error:", err)
	})

	http.Handle("/socket.io/", server)
	http.Handle("/", http.FileServer(http.Dir("./asset")))
	log.Println("Serving at localhost:5000...")
	log.Fatal(http.ListenAndServe(":5000", nil))
}
