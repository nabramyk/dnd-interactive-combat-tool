package models

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
func (el Element) collide(x int, y int, size int, id int) bool {}
func (el Element) within(x int, y int) bool {}
