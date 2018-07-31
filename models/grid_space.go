package models

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
	elements = append(elements, Element{id : elementIdCounter, x : x, y : y, size : size, shape : shape, color : color, category : category, name : name, space : &elements})
}

func (gs GridSpace) addAnnotationToGridSpace(el Element) {}
func (gs GridSpace) removeElementFromGridSpace(id int) {}
func (gs GridSpace) removeAnnotationFromGridSpace(id int) {}
func (gs GridSpace) removeAllElementsFromGridSpace() {}
func (gs GridSpace) nudgeElement(x int, y int, direction string) {}
func (gs GridSpace) warpElement(originX int, originY int, destX int, destY int) {}
func (gs GridSpace) gatherElementsWithinRegion() {}
