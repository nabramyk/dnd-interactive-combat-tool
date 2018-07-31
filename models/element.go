package main

type Element struct {
	id int
	x int
	y int
	size int
	shape String
	color String
	category String
	name String
	space *GridSpace
}

func (el Element) nudge(direction String) {}
func (el Element) warp(x int, y int) {}
func (el Element) mutate(modifiedElement Element) {}
func (el Element) collide(x int, y int, size int, id int) bool {}
func (el Element) within(x int, y int) bool {}
