"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Search, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Book {
  id: number
  title: string
  subtitle?: string
  summary?: string
  imageUrl?: string
  similarBooks: number[]
  author: {
    id: number
    name: string
    nationality?: string
    era?: string
    bio?: string
  }
  genre: {
    id: number
    name: string
  }
}

interface Author {
  id: number
  name: string
  nationality?: string
  era?: string
  bio?: string
}

interface Genre {
  id: number
  title: string
  description?: string
  url?: string
}

export function BookManagement() {
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Flask API base URL - adjust this to match your Flask server
  const API_BASE = "http://localhost:5000"

  useEffect(() => {
    fetchBooks()
    fetchAuthors()
    fetchGenres()
  }, [])

  const fetchBooks = async (genreId?: string) => {
    try {
      setIsLoading(true)
      const url = genreId && genreId !== "all" ? `${API_BASE}/books?genre_id=${genreId}` : `${API_BASE}/books`

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch books")

      const data = await response.json()
      setBooks(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch books",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAuthors = async () => {
    try {
      // Since your Flask app doesn't have an authors endpoint, we'll extract from books
      const response = await fetch(`${API_BASE}/books`)
      if (!response.ok) throw new Error("Failed to fetch authors")

      const books = await response.json()
      const uniqueAuthors = books.reduce((acc: Author[], book: Book) => {
        if (!acc.find((author) => author.id === book.author.id)) {
          acc.push(book.author)
        }
        return acc
      }, [])

      setAuthors(uniqueAuthors)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch authors",
        variant: "destructive",
      })
    }
  }

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`)
      if (!response.ok) throw new Error("Failed to fetch genres")

      const data = await response.json()
      setGenres(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch genres",
        variant: "destructive",
      })
    }
  }

  const handleGenreFilter = (genreId: string) => {
    setSelectedGenre(genreId)
    fetchBooks(genreId)
  }

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const uploadBookImage = async (bookId: number, file: File | undefined) => {
    if (!file) {
      toast({
        title: "Error",
        description: "No file selected",
        variant: "destructive",
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`${API_BASE}/upload_book_image/${bookId}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload image")

      const result = await response.json()
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })

      // Refresh books to show new image
      fetchBooks(selectedGenre === "all" ? undefined : selectedGenre)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Book Management</CardTitle>
          <CardDescription>
            Manage your book catalog and integrate with Make.com for automated data processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Books</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="genre-filter">Filter by Genre</Label>
              <Select value={selectedGenre} onValueChange={handleGenreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id.toString()}>
                      {genre.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading books...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="overflow-hidden">
                  <div className="aspect-[3/4] bg-gray-100 relative">
                    {book.imageUrl ? (
                      <img
                        src={`${API_BASE}${book.imageUrl}`}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute top-2 right-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) uploadBookImage(book.id, file)
                        }}
                        className="hidden"
                        id={`upload-${book.id}`}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => document.getElementById(`upload-${book.id}`)?.click()}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
                    {book.subtitle && <p className="text-sm text-gray-600 mb-2">{book.subtitle}</p>}
                    <p className="text-sm text-gray-700 mb-2">by {book.author.name}</p>
                    <Badge variant="secondary" className="mb-3">
                      {book.genre.name}
                    </Badge>
                    {book.summary && <p className="text-sm text-gray-600 line-clamp-3 mb-3">{book.summary}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
