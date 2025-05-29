"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, User, Database, Cloud, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Author {
  id: string | number
  name: string
  nationality?: string
  era?: string
  bio?: string
  source?: "mongodb" | "testdb"
  _id?: string
}

interface DatabaseStatus {
  mongodb: {
    status: "connected" | "error" | "unknown"
    message: string
    author_count: number
    database?: string
    collections?: string[]
  }
  testdb: {
    status: "connected" | "error" | "unknown"
    message: string
    author_count: number
  }
}

interface NewAuthor {
  name: string
  nationality: string
  era: string
  bio: string
}

export function AuthorTestDisplay() {
  const [mongoAuthors, setMongoAuthors] = useState<Author[]>([])
  const [testDbAuthors, setTestDbAuthors] = useState<Author[]>([])
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    mongodb: { status: "unknown", message: "", author_count: 0 },
    testdb: { status: "unknown", message: "", author_count: 0 },
  })
  const [isLoadingMongo, setIsLoadingMongo] = useState(false)
  const [isLoadingTestDb, setIsLoadingTestDb] = useState(false)
  const [isTestingMongo, setIsTestingMongo] = useState(false)
  const [activeTab, setActiveTab] = useState("mongodb")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAuthor, setNewAuthor] = useState<NewAuthor>({
    name: "",
    nationality: "",
    era: "",
    bio: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchMongoAuthors()
    fetchTestDbAuthors()
    testMongoConnection()
  }, [])

  const fetchMongoAuthors = async () => {
    setIsLoadingMongo(true)
    try {
      const response = await fetch("/api/mongodb/authors")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch MongoDB authors")
      }

      if (data.success) {
        // Format authors with source identifier
        const formattedAuthors = (data.authors || []).map((author) => ({
          ...author,
          source: "mongodb",
          id: author.id || author._id,
          data:author.authorD
        }))

        setMongoAuthors(formattedAuthors)
        setDbStatus((prev) => ({
          ...prev,
          mongodb: {
            status: "connected",
            message: "Successfully connected to MongoDB Atlas",
            author_count: data.count || 0,
          },
        }))

        toast({
          title: "MongoDB Authors Loaded",
          description: `Successfully loaded ${data.count || 0} authors from MongoDB`,
        })
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      console.error("Error fetching MongoDB authors:", error)
      setDbStatus((prev) => ({
        ...prev,
        mongodb: {
          status: "error",
          message: error.message,
          author_count: 0,
        },
      }))
      toast({
        title: "MongoDB Error",
        description: "Failed to fetch authors from MongoDB",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMongo(false)
    }
  }

  const fetchTestDbAuthors = async () => {
    setIsLoadingTestDb(true)
    try {
      const response = await fetch("/api/testdb/authors")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch test database authors")
      }

      if (data.success) {
        // Format authors with source identifier
        const formattedAuthors = (data.authors || []).map((author) => ({
          ...author,
          source: "testdb",
        }))

        setTestDbAuthors(formattedAuthors)
        setDbStatus((prev) => ({
          ...prev,
          testdb: {
            status: "connected",
            message: data.note || "Successfully connected to Test Database",
            author_count: data.count || 0,
          },
        }))

        toast({
          title: "Test DB Authors Loaded",
          description: `Successfully loaded ${data.count || 0} authors from Test Database`,
        })
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      console.error("Error fetching Test DB authors:", error)
      setDbStatus((prev) => ({
        ...prev,
        testdb: {
          status: "error",
          message: error.message,
          author_count: 0,
        },
      }))
      toast({
        title: "Test DB Error",
        description: "Failed to fetch authors from Test Database",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTestDb(false)
    }
  }

  const testMongoConnection = async () => {
    setIsTestingMongo(true)
    try {
      const response = await fetch("/api/mongodb/test-connection")
      const data = await response.json()

      if (data.success) {
        setDbStatus((prev) => ({
          ...prev,
          mongodb: {
            ...prev.mongodb,
            status: "connected",
            message: data.message,
            database: data.database,
            collections: data.collections,
          },
        }))

        toast({
          title: "MongoDB Connection Test Successful",
          description: `Connected to database: ${data.database}`,
        })
      } else {
        throw new Error(data.details || data.error || "Connection test failed")
      }
    } catch (error) {
      setDbStatus((prev) => ({
        ...prev,
        mongodb: {
          ...prev.mongodb,
          status: "error",
          message: error.message,
        },
      }))
      toast({
        title: "MongoDB Connection Test Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsTestingMongo(false)
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
        fetchMongoAuthors()
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      toast({
        title: "Error Creating Author",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const renderAuthorGrid = (authors: Author[], isLoading: boolean, source: string) => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-spin" />
          <p className="text-gray-500">Loading authors from {source}...</p>
        </div>
      )
    }

    if (authors.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No authors found in {source}</p>
          <p className="text-xs mt-1">Try refreshing or check your connection</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors.map((author, index) => (
          <Card key={`${author.source}-${author.id || author._id || index}`} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    author.source === "mongodb" ? "bg-green-100" : "bg-blue-100"
                  }`}
                >
                  {author.source === "mongodb" ? (
                    <Cloud className="h-5 w-5 text-green-600" />
                  ) : (
                    <Database className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{author.name || "Unknown Author"}</h3>
                  {author.nationality && (
                    <p className="text-xs text-gray-600 mb-1">
                      <strong>Nationality:</strong> {author.nationality}
                    </p>
                  )}
                  {author.era && (
                    <Badge variant="secondary" className="text-xs mb-2">
                      {author.era}
                    </Badge>
                  )}
                  {author.bio && (
                    <p
                      className="text-xs text-gray-700 mb-2 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {author.bio}
                    </p>
                  )}

                  {author.data && (
                    <p
                      className="text-xs text-gray-700 mb-2 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {author.}
                    </p>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      ID: {author.id || author._id || "N/A"}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        author.source === "mongodb" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {author.source === "mongodb" ? "MongoDB" : "Test DB"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Database Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connections Status
          </CardTitle>
          <CardDescription>Direct connection status for MongoDB Atlas and Test Database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MongoDB Status */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-green-500" />
                  MongoDB Atlas (Direct Connection)
                </h3>
                <Badge
                  className={
                    dbStatus.mongodb.status === "connected"
                      ? "bg-green-100 text-green-800"
                      : dbStatus.mongodb.status === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                  }
                >
                  {dbStatus.mongodb.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">{dbStatus.mongodb.message}</p>
              <div className="space-y-1 text-xs">
                <p>
                  <strong>Authors:</strong> {dbStatus.mongodb.author_count}
                </p>
                {dbStatus.mongodb.database && (
                  <p>
                    <strong>Database:</strong> {dbStatus.mongodb.database}
                  </p>
                )}
                {dbStatus.mongodb.collections && (
                  <p>
                    <strong>Collections:</strong> {dbStatus.mongodb.collections.join(", ")}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={testMongoConnection}
                disabled={isTestingMongo}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isTestingMongo ? "animate-spin" : ""}`} />
                Test MongoDB Connection
              </Button>
            </div>

            {/* Test DB Status */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  Test Database (Mock Data)
                </h3>
                <Badge
                  className={
                    dbStatus.testdb.status === "connected"
                      ? "bg-green-100 text-green-800"
                      : dbStatus.testdb.status === "error"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }
                >
                  {dbStatus.testdb.status === "error" ? "Mock Data" : dbStatus.testdb.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">{dbStatus.testdb.message}</p>
              <p className="text-sm font-medium">Authors: {dbStatus.testdb.author_count}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={fetchTestDbAuthors}
                disabled={isLoadingTestDb}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTestDb ? "animate-spin" : ""}`} />
                Refresh Test DB
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authors Data Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Authors from Multiple Sources</CardTitle>
              <CardDescription>View and manage authors from MongoDB Atlas and your Test Database</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Author to MongoDB
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Author Form */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Add New Author to MongoDB</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mongodb" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                MongoDB ({mongoAuthors.length})
              </TabsTrigger>
              <TabsTrigger value="testdb" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Test DB ({testDbAuthors.length})
              </TabsTrigger>
              <TabsTrigger value="combined" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Combined ({mongoAuthors.length + testDbAuthors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mongodb" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">MongoDB Authors</h3>
                <Button variant="outline" size="sm" onClick={fetchMongoAuthors} disabled={isLoadingMongo}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMongo ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              {renderAuthorGrid(mongoAuthors, isLoadingMongo, "MongoDB")}
            </TabsContent>

            <TabsContent value="testdb" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Test Database Authors</h3>
                <Button variant="outline" size="sm" onClick={fetchTestDbAuthors} disabled={isLoadingTestDb}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTestDb ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              {renderAuthorGrid(testDbAuthors, isLoadingTestDb, "Test Database")}
            </TabsContent>

            <TabsContent value="combined" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">All Authors (Combined)</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchMongoAuthors} disabled={isLoadingMongo}>
                    <Cloud className="h-4 w-4 mr-1" />
                    Refresh MongoDB
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchTestDbAuthors} disabled={isLoadingTestDb}>
                    <Database className="h-4 w-4 mr-1" />
                    Refresh Test DB
                  </Button>
                </div>
              </div>
              {renderAuthorGrid([...mongoAuthors, ...testDbAuthors], isLoadingMongo || isLoadingTestDb, "Both Sources")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Database Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-green-800">MongoDB Atlas Configuration:</h4>
              <div className="text-xs text-green-700 space-y-1">
                <div>
                  • <strong>Connection:</strong> Direct MongoDB Atlas connection (secure)
                </div>
                <div>
                  • <strong>Database:</strong> bookstore
                </div>
                <div>
                  • <strong>Collection:</strong> authors
                </div>
                <div>
                  • <strong>Features:</strong> Read, Write, Test Connection
                </div>
                <div>
                  • <strong>Security:</strong> Server-side only, credentials protected
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-blue-800">Test Database Configuration:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>
                  • <strong>Status:</strong> Mock data (replace with your actual database)
                </div>
                <div>
                  • <strong>Location:</strong> /api/testdb/authors
                </div>
                <div>
                  • <strong>Note:</strong> Update the API route with your actual database connection
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-yellow-800">Security Improvements:</h4>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>
                  • <strong>Removed Make.com dependency:</strong> No more insecure HTTP connections
                </div>
                <div>
                  • <strong>Direct MongoDB connection:</strong> Secure server-side API routes
                </div>
                <div>
                  • <strong>Protected credentials:</strong> MongoDB credentials stored server-side only
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
