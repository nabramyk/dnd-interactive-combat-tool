package main

type GridSpace struct {
	elementIdCounter int
	annotationsIdCounter int
	id int
	//history []
	elements []Element
	annotations []String
	width int
	height int
	name String
}

func (gs GridSpace) resizeWidth(width int) {
	gs.width = width
}

func (gs GridSpace) resizeHeight(height int) {
	
}
