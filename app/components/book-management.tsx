"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit, Search, RefreshCw, Plus, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Book {
  _id: string
  title: string
  subtitle?: string
  summary?: string
  image_filename?: string
  similar_books?: string[]
  author: {
    name: string
    nationality?: string
    era?: string
  }
  genre: {
    name: string
  }
  created_at?: string
  updated_at?: string
}

interface Author {
  _id: string
  name: string
  nationality?: string
  era?: string
}

interface Genre {
  _id: string
  name: string
  description?: string
  bookCount?: number
}

export function BookManagement() {
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBooks()
    fetchAuthors()
    fetchGenres()
  }, [])

  const fetchBooks = async (genreId?: string, authorId?: string) => {
    try {
      setIsLoading(true)
      const searchParams = new URLSearchParams({
        page: "1",
        limit: "50",
        search: searchTerm,
        sort: "title",
        direction: "asc",
      })

      if (genreId && genreId !== "all") {
        searchParams.append("genre_id", genreId)
      }

      if (authorId && authorId !== "all") {
        searchParams.append("author_id", authorId)
      }

      const response = await fetch(`/api/mongodb/books?${searchParams}`)
      if (!response.ok) throw new Error("Failed to fetch books")

      const data = await response.json()
      if (data.success) {
        setBooks(data.books)
        toast({
          title: "Books Loaded",
          description: `Successfully loaded ${data.books.length} books`,
        })
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        title: "Error",
        description: "Failed to fetch books: " + errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAuthors = async () => {
    try {
      const response = await fetch("/api/mongodb/authors?limit=100")
      if (!response.ok) throw new Error("Failed to fetch authors")

      const data = await response.json()
      if (data.success) {
        setAuthors(data.authors)
      }
    } catch (error) {
      console.error("Error fetching authors:", error)
    }
  }

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/mongodb/genres?limit=100")
      if (!response.ok) throw new Error("Failed to fetch genres")

      const data = await response.json()
      if (data.success) {
        setGenres(data.genres)
      }
    } catch (error) {
      console.error("Error fetching genres:", error)
    }
  }

  const handleGenreFilter = (genreId: string) => {
    setSelectedGenre(genreId)
    fetchBooks(genreId, selectedAuthor)
  }

  const handleAuthorFilter = (authorId: string) => {
    setSelectedAuthor(authorId)
    fetchBooks(selectedGenre, authorId)
  }

  const handleSearch = () => {
    fetchBooks(selectedGenre, selectedAuthor)
  }

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.genre.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Book Management</CardTitle>
              <CardDescription>Manage your book catalog stored in MongoDB</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Books</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, author, or genre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="genre-filter">Filter by Genre</Label>
              <Select value={selectedGenre} onValueChange={handleGenreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre._id} value={genre._id}>
                      {genre.name} ({genre.bookCount || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="author-filter">Filter by Author</Label>
              <Select value={selectedAuthor} onValueChange={handleAuthorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Authors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Authors</SelectItem>
                  {authors.map((author) => (
                    <SelectItem key={author._id} value={author._id}>
                      {author.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button onClick={handleSearch} variant="secondary">
              Search
            </Button>
            <Button onClick={() => fetchBooks()} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Books Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-spin" />
              <p className="text-gray-500">Loading books...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <Card key={book._id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[3/4] bg-gray-100 relative">
                    {book.image_filename ? (
                      <img
                        src={`/placeholder.svg?height=400&width=300&text=${encodeURIComponent(book.title)}`}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
                    {book.subtitle && <p className="text-sm text-gray-600 mb-2 line-clamp-1">{book.subtitle}</p>}
                    <p className="text-sm text-gray-700 mb-2">by {book.author.name}</p>
                    <div className="flex gap-1 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {book.genre.name}
                      </Badge>
                      {book.author.era && (
                        <Badge variant="outline" className="text-xs">
                          {book.author.era}
                        </Badge>
                      )}
                    </div>
                    {book.summary && <p className="text-sm text-gray-600 line-clamp-3 mb-3">{book.summary}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedBook(book)}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredBooks.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No books found</p>
              {searchTerm && <p className="text-xs mt-1">Try adjusting your search criteria</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Details Dialog */}
      <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Details</DialogTitle>
            <DialogDescription>Complete information about {selectedBook?.title}</DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Title</h3>
                  <p className="text-sm">{selectedBook.title}</p>
                </div>
                {selectedBook.subtitle && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">Subtitle</h3>
                    <p className="text-sm">{selectedBook.subtitle}</p>
                  </div>
                )}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Author</h3>
                  <p className="text-sm">{selectedBook.author.name}</p>
                  {selectedBook.author.nationality && (
                    <p className="text-xs text-gray-600">{selectedBook.author.nationality}</p>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Genre</h3>
                  <p className="text-sm">{selectedBook.genre.name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">MongoDB ID</h3>
                  <p className="text-xs font-mono">{selectedBook._id}</p>
                </div>
                {selectedBook.image_filename && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">Image</h3>
                    <p className="text-sm">{selectedBook.image_filename}</p>
                  </div>
                )}
              </div>
              {selectedBook.summary && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Summary</h3>
                  <p className="text-sm whitespace-pre-wrap">{selectedBook.summary}</p>
                </div>
              )}
              {selectedBook.similar_books && selectedBook.similar_books.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-1">Similar Books</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedBook.similar_books.map((bookId, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {bookId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedBook.created_at && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">Created</h3>
                    <p className="text-sm">{new Date(selectedBook.created_at).toLocaleString()}</p>
                  </div>
                  {selectedBook.updated_at && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-sm mb-1">Updated</h3>
                      <p className="text-sm">{new Date(selectedBook.updated_at).toLocaleString()}</p>
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
