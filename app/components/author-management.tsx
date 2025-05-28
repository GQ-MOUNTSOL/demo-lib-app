"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Author {
  id: number
  name: string
  nationality?: string
  era?: string
  bio?: string
  bookCount?: number
}

export function AuthorManagement() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const API_BASE = "http://localhost:5000"

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/books`)
      if (!response.ok) throw new Error("Failed to fetch books")

      const books = await response.json()
      const authorMap = new Map()

      books.forEach((book: any) => {
        const authorId = book.author.id
        if (authorMap.has(authorId)) {
          authorMap.get(authorId).bookCount++
        } else {
          authorMap.set(authorId, {
            ...book.author,
            bookCount: 1,
          })
        }
      })

      setAuthors(Array.from(authorMap.values()))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch authors",
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
              <CardTitle>Author Management</CardTitle>
              <CardDescription>Manage author information and view their published books</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Author
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading authors...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {authors.map((author) => (
                <Card key={author.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{author.name}</h3>
                        {author.nationality && <p className="text-sm text-gray-600 mb-1">{author.nationality}</p>}
                        {author.era && (
                          <Badge variant="secondary" className="mb-2">
                            {author.era}
                          </Badge>
                        )}
                        <p className="text-sm text-gray-600 mb-3">
                          {author.bookCount} {author.bookCount === 1 ? "book" : "books"}
                        </p>
                        {author.bio && <p className="text-sm text-gray-700 line-clamp-3 mb-3">{author.bio}</p>}
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
