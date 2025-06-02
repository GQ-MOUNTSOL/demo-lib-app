"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, User, Search, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Author {
  _id: string
  name: string
  nationality?: string
  era?: string
  bio?: string
  created_at?: string
  updated_at?: string
  bookCount?: number
}

interface NewAuthor {
  name: string
  nationality: string
  era: string
  bio: string
}

export function AuthorManagement() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAuthor, setNewAuthor] = useState<NewAuthor>({
    name: "",
    nationality: "",
    era: "",
    bio: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    try {
      setIsLoading(true)
      const searchParams = new URLSearchParams({
        page: "1",
        limit: "50",
        search: searchTerm,
        sort: "name",
        direction: "asc",
      })

      const response = await fetch(`/api/mongodb/authors?${searchParams}`)
      if (!response.ok) throw new Error("Failed to fetch authors")

      const data = await response.json()
      if (data.success) {
        setAuthors(data.authors)
        toast({
          title: "Authors Loaded",
          description: `Successfully loaded ${data.authors.length} authors`,
        })
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        title: "Error",
        description: "Failed to fetch authors: " + errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createAuthor = async () => {
    if (!newAuthor.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Author name is required",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/mongodb/authors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAuthor),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to create author")
      }

      if (data.success) {
        toast({
          title: "Author Created",
          description: `Successfully created author: ${newAuthor.name}`,
        })

        // Reset form
        setNewAuthor({ name: "", nationality: "", era: "", bio: "" })
        setShowAddForm(false)

        // Refresh the authors list
        fetchAuthors()
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        title: "Error Creating Author",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleSearch = () => {
    fetchAuthors()
  }

  const filteredAuthors = authors.filter(
    (author) =>
      author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      author.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      author.era?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Author Management</CardTitle>
              <CardDescription>Manage author information stored in MongoDB</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Author
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Authors</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, nationality, or era..."
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
              <Button onClick={fetchAuthors} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Authors Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-spin" />
              <p className="text-gray-500">Loading authors...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuthors.map((author) => (
                <Card key={author._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{author.name}</h3>
                        {author.nationality && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Nationality:</strong> {author.nationality}
                          </p>
                        )}
                        {author.era && (
                          <Badge variant="secondary" className="mb-2">
                            {author.era}
                          </Badge>
                        )}
                        {author.bio && <p className="text-sm text-gray-700 line-clamp-3 mb-3">{author.bio}</p>}
                        {author.created_at && (
                          <p className="text-xs text-gray-500 mb-3">
                            Created: {new Date(author.created_at).toLocaleDateString()}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAuthor(author)
                              setIsEditing(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedAuthor(author)}>
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

          {filteredAuthors.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No authors found</p>
              {searchTerm && <p className="text-xs mt-1">Try adjusting your search criteria</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Author Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Author</DialogTitle>
            <DialogDescription>Create a new author record in MongoDB</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newAuthor.name}
                onChange={(e) => setNewAuthor((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Author name"
              />
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={newAuthor.nationality}
                onChange={(e) => setNewAuthor((prev) => ({ ...prev, nationality: e.target.value }))}
                placeholder="e.g., American, British"
              />
            </div>
            <div>
              <Label htmlFor="era">Era/Time Period</Label>
              <Input
                id="era"
                value={newAuthor.era}
                onChange={(e) => setNewAuthor((prev) => ({ ...prev, era: e.target.value }))}
                placeholder="e.g., Modern, 20th Century"
              />
            </div>
            <div>
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={newAuthor.bio}
                onChange={(e) => setNewAuthor((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Brief biography of the author"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createAuthor} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Author"
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Author Details Dialog */}
      <Dialog open={!!selectedAuthor} onOpenChange={(open) => !open && setSelectedAuthor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Author Details</DialogTitle>
            <DialogDescription>Complete information about {selectedAuthor?.name}</DialogDescription>
          </DialogHeader>
          {selectedAuthor && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Name</h3>
                  <p className="text-sm">{selectedAuthor.name}</p>
                </div>
                {selectedAuthor.nationality && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">Nationality</h3>
                    <p className="text-sm">{selectedAuthor.nationality}</p>
                  </div>
                )}
                {selectedAuthor.era && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">Era</h3>
                    <p className="text-sm">{selectedAuthor.era}</p>
                  </div>
                )}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">MongoDB ID</h3>
                  <p className="text-xs font-mono">{selectedAuthor._id}</p>
                </div>
              </div>
              {selectedAuthor.bio && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Biography</h3>
                  <p className="text-sm whitespace-pre-wrap">{selectedAuthor.bio}</p>
                </div>
              )}
              {selectedAuthor.created_at && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">Created</h3>
                    <p className="text-sm">{new Date(selectedAuthor.created_at).toLocaleString()}</p>
                  </div>
                  {selectedAuthor.updated_at && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-sm mb-1">Updated</h3>
                      <p className="text-sm">{new Date(selectedAuthor.updated_at).toLocaleString()}</p>
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
