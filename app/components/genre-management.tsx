"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Tag, Search, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Genre {
  _id: string
  name: string
  description?: string
  url?: string
  bookCount?: number
  created_at?: string
  updated_at?: string
}

interface NewGenre {
  name: string
  description: string
  url: string
}

export function GenreManagement() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGenre, setNewGenre] = useState<NewGenre>({
    name: "",
    description: "",
    url: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    try {
      setIsLoading(true)
      const searchParams = new URLSearchParams({
        page: "1",
        limit: "50",
        search: searchTerm,
        sort: "name",
        direction: "asc",
      })

      const response = await fetch(`/api/mongodb/genres?${searchParams}`)
      if (!response.ok) throw new Error("Failed to fetch genres")

      const data = await response.json()
      if (data.success) {
        setGenres(data.genres)
        toast({
          title: "Genres Loaded",
          description: `Successfully loaded ${data.genres.length} genres`,
        })
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        title: "Error",
        description: "Failed to fetch genres: " + errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createGenre = async () => {
    if (!newGenre.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Genre name is required",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/mongodb/genres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newGenre),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to create genre")
      }

      if (data.success) {
        toast({
          title: "Genre Created",
          description: `Successfully created genre: ${newGenre.name}`,
        })

        // Reset form
        setNewGenre({ name: "", description: "", url: "" })
        setShowAddForm(false)

        // Refresh the genres list
        fetchGenres()
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        title: "Error Creating Genre",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleSearch = () => {
    fetchGenres()
  }

  const filteredGenres = genres.filter(
    (genre) =>
      genre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      genre.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Genre Management</CardTitle>
              <CardDescription>Manage book categories and genres stored in MongoDB</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Genre
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Genres</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <Button onClick={handleSearch} variant="secondary">
                Search
              </Button>
              <Button onClick={fetchGenres} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Genres Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-spin" />
              <p className="text-gray-500">Loading genres...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGenres.map((genre) => (
                <Card key={genre._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Tag className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{genre.name}</h3>
                        {genre.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{genre.description}</p>
                        )}
                        <Badge variant="secondary" className="mb-3">
                          {genre.bookCount || 0} {genre.bookCount === 1 ? "book" : "books"}
                        </Badge>
                        {genre.url && (
                          <p className="text-xs text-blue-600 mb-3 truncate">
                            <a href={genre.url} target="_blank" rel="noopener noreferrer">
                              {genre.url}
                            </a>
                          </p>
                        )}
                        {genre.created_at && (
                          <p className="text-xs text-gray-500 mb-3">
                            Created: {new Date(genre.created_at).toLocaleDateString()}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedGenre(genre)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredGenres.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No genres found</p>
              {searchTerm && <p className="text-xs mt-1">Try adjusting your search criteria</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Genre Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Genre</DialogTitle>
            <DialogDescription>Create a new genre record in MongoDB</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newGenre.name}
                onChange={(e) => setNewGenre((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Genre name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGenre.description}
                onChange={(e) => setNewGenre((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the genre"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={newGenre.url}
                onChange={(e) => setNewGenre((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="Optional URL for more information"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createGenre} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Genre"
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Genre Details Dialog */}
      <Dialog open={!!selectedGenre} onOpenChange={(open) => !open && setSelectedGenre(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Genre Details</DialogTitle>
            <DialogDescription>Complete information about {selectedGenre?.name}</DialogDescription>
          </DialogHeader>
          {selectedGenre && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Name</h3>
                  <p className="text-sm">{selectedGenre.name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Book Count</h3>
                  <p className="text-sm">{selectedGenre.bookCount || 0} books</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">MongoDB ID</h3>
                  <p className="text-xs font-mono">{selectedGenre._id}</p>
                </div>
                {selectedGenre.url && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">URL</h3>
                    <a
                      href={selectedGenre.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {selectedGenre.url}
                    </a>
                  </div>
                )}
              </div>
              {selectedGenre.description && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{selectedGenre.description}</p>
                </div>
              )}
              {selectedGenre.created_at && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">Created</h3>
                    <p className="text-sm">{new Date(selectedGenre.created_at).toLocaleString()}</p>
                  </div>
                  {selectedGenre.updated_at && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-sm mb-1">Updated</h3>
                      <p className="text-sm">{new Date(selectedGenre.updated_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
