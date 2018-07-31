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
	gs.length = length
}

func (gs GridSpace) findElementById(x int, y int) {}
func (gs GridSpace) hasElementAtPosition(x int, y int) {}
func (gs GridSpace) generateRandomBoardElements() {}
func (gs GridSpace) addElementToGridSpace(el Element) {}
func (gs GridSpace) addAnnotationToGridSpace(el Element) {}
func (gs GridSpace) removeElementFromGridSpace(id int) {}
func (gs GridSpace) removeAnnotationFromGridSpace(id int) {}
func (gs GridSpace) removeAllElementsFromGridSpace() {}
func (gs GridSpace) nudgeElement(x int, y int, direction String) {}
func (gs GridSpace) warpElement(originX int, originY int, destX int, destY int) {}
func (gs GridSpace) gatherElementsWithinRegion() {}
