"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Genre {
  id: number
  title: string
  description?: string
  url?: string
  bookCount?: number
}

export function GenreManagement() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const API_BASE = "http://localhost:5000"

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    try {
      setIsLoading(true)
      const [genresResponse, booksResponse] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/books`),
      ])

      if (!genresResponse.ok || !booksResponse.ok) {
        throw new Error("Failed to fetch data")
      }

      const genresData = await genresResponse.json()
      const booksData = await booksResponse.json()

      // Count books per genre
      const genreBookCount = booksData.reduce((acc: any, book: any) => {
        const genreId = book.genre.id
        acc[genreId] = (acc[genreId] || 0) + 1
        return acc
      }, {})

      const genresWithCount = genresData.map((genre: any) => ({
        ...genre,
        bookCount: genreBookCount[genre.id] || 0,
      }))

      setGenres(genresWithCount)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch genres",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Genre Management</CardTitle>
              <CardDescription>Manage book categories and genres</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Genre
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading genres...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {genres.map((genre) => (
                <Card key={genre.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Tag className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{genre.title}</h3>
                        {genre.description && <p className="text-sm text-gray-600 mb-2">{genre.description}</p>}
                        <Badge variant="secondary" className="mb-3">
                          {genre.bookCount} {genre.bookCount === 1 ? "book" : "books"}
                        </Badge>
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
                      </div>
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
