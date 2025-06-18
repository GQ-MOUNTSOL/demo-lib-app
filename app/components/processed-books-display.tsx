"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, BookOpen, User, Clock, Globe, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AuthorInformation {
  full_name: string
  nationality: string
  time_period: string
  brief_biography: string
}

interface MultilingualInfo {
  urdu: { book_title: string; author_name: string; genre_classification: string }
  arabic: { book_title: string; author_name: string; genre_classification: string }
  german: { book_title: string; author_name: string; genre_classification: string }
  spanish: { book_title: string; author_name: string; genre_classification: string }
}

interface ProcessedBook {
  id?: string
  book_title: string
  primary_genre: string
  subgenres: string[]
  author_information: AuthorInformation
  similar_books: string[]
  famous_reviews: string[]
  multilingual_information: MultilingualInfo
  timestamp?: string
  status?: "completed" | "processing" | "failed"
  summary?: string
  // Legacy support for old format
  title?: string
  bookTitle?: string
  author?: string
  data?: any
}

interface ProcessedBooksDisplayProps {
  processedBooks?: ProcessedBook[]
}

export function ProcessedBooksDisplay({ processedBooks: propBooks = [] }: ProcessedBooksDisplayProps) {
  const [processedBooks, setProcessedBooks] = useState<ProcessedBook[]>(propBooks)
  const [selectedBook, setSelectedBook] = useState<ProcessedBook | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const { toast } = useToast()

  // Update local state when props change
  useEffect(() => {
    if (propBooks.length > 0) {
      setProcessedBooks(propBooks)
      setLastFetched(new Date())

      // Auto-select first book if none selected
      if (!selectedBook && propBooks.length > 0) {
        setSelectedBook(propBooks[0])
      }
    }
  }, [propBooks])

  const downloadBookData = (book: ProcessedBook) => {
    const dataStr = JSON.stringify(book, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    const bookTitle = getBookTitle(book)
    link.download = `${bookTitle.replace(/\s+/g, "_")}_processed_data.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getBookTitle = (book: ProcessedBook) => {
    return book.book_title || book.title || book.bookTitle || "Unknown Title"
  }

  const getBookAuthor = (book: ProcessedBook) => {
    return book.author_information?.full_name || book.author || "Unknown Author"
  }

  const getAuthorNationality = (book: ProcessedBook) => {
    return book.author_information?.nationality || "Unknown"
  }

  const getAuthorTimePeriod = (book: ProcessedBook) => {
    return book.author_information?.time_period || "Unknown"
  }

  const getAuthorBio = (book: ProcessedBook) => {
    return book.author_information?.brief_biography || "No biography available"
  }

  const getPrimaryGenre = (book: ProcessedBook) => {
    return book.primary_genre || "Unknown Genre"
  }

  const getSubgenres = (book: ProcessedBook) => {
    return book.subgenres || []
  }

  const getSimilarBooks = (book: ProcessedBook) => {
    return book.similar_books || []
  }

  const getFamousReviews = (book: ProcessedBook) => {
    return book.famous_reviews || []
  }

  const getMultilingualInfo = (book: ProcessedBook) => {
    return book.multilingual_information || null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Processed Books from Make.com</CardTitle>
              <CardDescription>
                View detailed book analysis including metadata, reviews, and multilingual information
                {lastFetched && (
                  <span className="block mt-1 text-xs text-gray-500">Last updated: {lastFetched.toLocaleString()}</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {processedBooks.length} books loaded
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {processedBooks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Processed Books Yet</h3>
            <p className="text-gray-500 mb-4">Books processed through Make.com will appear here.</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>To see processed books:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Send a book for analysis in the "Send & Monitor" tab</li>
                <li>Wait for Make.com to process the data</li>
                <li>Results will appear here automatically</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Books List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Processed Books ({processedBooks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {processedBooks.map((book, index) => (
                    <div
                      key={book.id || index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedBook === book ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedBook(book)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{getBookTitle(book)}</h3>
                          <p className="text-xs text-gray-600 mt-1">by {getBookAuthor(book)}</p>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {getPrimaryGenre(book)}
                            </Badge>
                          </div>
                          {book.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(book.timestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-green-100 text-green-800">{book.status || "completed"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Book Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {selectedBook ? getBookTitle(selectedBook) : "Select a book to view details"}
                </CardTitle>
                {selectedBook && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => downloadBookData(selectedBook)}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedBook ? (
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="author">Author</TabsTrigger>
                    <TabsTrigger value="similar">Similar</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    <TabsTrigger value="languages">Languages</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Book Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Title:</strong> {getBookTitle(selectedBook)}
                          </p>
                          <p>
                            <strong>Primary Genre:</strong> {getPrimaryGenre(selectedBook)}
                          </p>
                          <div>
                            <strong>Subgenres:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {getSubgenres(selectedBook).map((genre, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Author Summary
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Name:</strong> {getBookAuthor(selectedBook)}
                          </p>
                          <p>
                            <strong>Nationality:</strong> {getAuthorNationality(selectedBook)}
                          </p>
                          <p>
                            <strong>Period:</strong> {getAuthorTimePeriod(selectedBook)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedBook.summary && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Book Summary</h3>
                        <ScrollArea className="h-[200px]">
                          <p className="text-sm leading-relaxed">{selectedBook.summary}</p>
                        </ScrollArea>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="author" className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Author Information
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm">
                              <strong>Full Name:</strong> {getBookAuthor(selectedBook)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm">
                              <strong>Nationality:</strong> {getAuthorNationality(selectedBook)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm">
                            <strong>Time Period:</strong> {getAuthorTimePeriod(selectedBook)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            <strong>Biography:</strong>
                          </p>
                          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{getAuthorBio(selectedBook)}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="similar" className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-3">Similar Books</h3>
                      {getSimilarBooks(selectedBook).length > 0 ? (
                        <div className="space-y-2">
                          {getSimilarBooks(selectedBook).map((book, index) => (
                            <div key={index} className="p-2 bg-white rounded border">
                              <p className="text-sm font-medium">{book}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No similar books listed</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Famous Reviews
                      </h3>
                      {getFamousReviews(selectedBook).length > 0 ? (
                        <div className="space-y-3">
                          {getFamousReviews(selectedBook).map((review, index) => (
                            <div key={index} className="p-3 bg-white rounded border-l-4 border-blue-500">
                              <p className="text-sm italic">"{review}"</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No reviews available</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="languages" className="space-y-4">
                    {getMultilingualInfo(selectedBook) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(getMultilingualInfo(selectedBook)!).map(([lang, data]) => (
                          <div key={lang} className="p-4 border rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 capitalize">
                              <Globe className="h-4 w-4" />
                              {lang === "urdu"
                                ? "اردو (Urdu)"
                                : lang === "arabic"
                                  ? "العربية (Arabic)"
                                  : lang === "german"
                                    ? "Deutsch (German)"
                                    : "Español (Spanish)"}
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p>
                                <strong>Title:</strong> {data.book_title}
                              </p>
                              <p>
                                <strong>Author:</strong> {data.author_name}
                              </p>
                              <p>
                                <strong>Genre:</strong> {data.genre_classification}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Globe className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No multilingual information available</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a book from the list to view its processed data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
