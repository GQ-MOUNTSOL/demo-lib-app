"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw, Database, FileJson, Table, Key, List } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CollectionSchema {
  name: string
  count: number
  fields: {
    name: string
    type: string
    count: number
    percentage: number
    sample?: any
  }[]
  indexes?: {
    name: string
    key: Record<string, number>
    unique?: boolean
  }[]
}

interface DatabaseSchema {
  name: string
  collections: CollectionSchema[]
}

export function MongoDBSchemaExplorer() {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSchema()
  }, [])

  const fetchSchema = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/mongodb/schema")

      if (!response.ok) {
        throw new Error("Failed to fetch MongoDB schema")
      }

      const data = await response.json()

      if (data.success) {
        setSchema(data.schema)

        // Set active collection to the first one
        if (data.schema.collections.length > 0) {
          setActiveCollection(data.schema.collections[0].name)
        }

        toast({
          title: "Schema Loaded",
          description: `Successfully loaded schema for ${data.schema.name} database`,
        })
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      console.error("Error fetching MongoDB schema:", error)
      toast({
        title: "Schema Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCollectionByName = (name: string): CollectionSchema | undefined => {
    return schema?.collections.find((c) => c.name === name)
  }

  const renderFieldTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "string":
        return "bg-blue-100 text-blue-800"
      case "number":
        return "bg-green-100 text-green-800"
      case "boolean":
        return "bg-purple-100 text-purple-800"
      case "date":
        return "bg-yellow-100 text-yellow-800"
      case "objectid":
        return "bg-red-100 text-red-800"
      case "array":
        return "bg-indigo-100 text-indigo-800"
      case "object":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderSampleValue = (value: any, type: string) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>
    }

    if (type.toLowerCase() === "objectid") {
      return <span className="text-red-600">{value}</span>
    }

    if (type.toLowerCase() === "date") {
      return <span className="text-yellow-600">{new Date(value).toLocaleString()}</span>
    }

    if (type.toLowerCase() === "array") {
      return <span className="text-indigo-600">[Array: {Array.isArray(value) ? value.length : "?"} items]</span>
    }

    if (type.toLowerCase() === "object") {
      return <span className="text-orange-600">{"{Object}"}</span>
    }

    if (type.toLowerCase() === "boolean") {
      return <span className="text-purple-600">{String(value)}</span>
    }

    if (type.toLowerCase() === "number") {
      return <span className="text-green-600">{value}</span>
    }

    // Default for strings and other types
    return (
      <span className="text-blue-600">
        {String(value).substring(0, 50)}
        {String(value).length > 50 ? "..." : ""}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                MongoDB Schema Explorer
              </CardTitle>
              <CardDescription>Explore your MongoDB database structure, collections, and field types</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSchema} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Schema
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-spin" />
              <p className="text-gray-500">Loading MongoDB schema...</p>
            </div>
          ) : !schema ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No schema information available</p>
              <p className="text-xs mt-1">Click "Refresh Schema" to load database structure</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold">{schema.name}</h3>
                  <p className="text-sm text-blue-700">{schema.collections.length} collections available</p>
                </div>
              </div>

              <Tabs value={activeCollection || ""} onValueChange={setActiveCollection} className="space-y-4">
                <ScrollArea className="w-full" type="always">
                  <div className="pb-3">
                    <TabsList className="w-max">
                      {schema.collections.map((collection) => (
                        <TabsTrigger key={collection.name} value={collection.name} className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          {collection.name}
                          <Badge variant="secondary" className="ml-1">
                            {collection.count}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </ScrollArea>

                {schema.collections.map((collection) => (
                  <TabsContent key={collection.name} value={collection.name} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileJson className="h-5 w-5" />
                            Fields Schema
                          </CardTitle>
                          <CardDescription>
                            Field types and distribution in the {collection.name} collection
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {collection.fields.map((field) => (
                              <div key={field.name} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{field.name}</span>
                                    <Badge className={renderFieldTypeColor(field.type)}>{field.type}</Badge>
                                  </div>
                                  <Badge variant="outline">
                                    {field.count}/{collection.count} ({field.percentage}%)
                                  </Badge>
                                </div>
                                {field.sample !== undefined && (
                                  <div className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                    <span className="text-gray-500">Sample: </span>
                                    {renderSampleValue(field.sample, field.type)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Indexes
                          </CardTitle>
                          <CardDescription>Indexes defined on this collection</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {collection.indexes && collection.indexes.length > 0 ? (
                            <div className="space-y-3">
                              {collection.indexes.map((index, i) => (
                                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold">{index.name}</span>
                                    {index.unique && <Badge className="bg-purple-100 text-purple-800">Unique</Badge>}
                                  </div>
                                  <div className="text-xs">
                                    {Object.entries(index.key).map(([field, direction]) => (
                                      <div key={field} className="flex items-center justify-between p-1">
                                        <span>{field}</span>
                                        <Badge variant="outline">{direction === 1 ? "Ascending" : "Descending"}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <Key className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                              <p>No indexes found</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <List className="h-5 w-5" />
                          Collection Overview
                        </CardTitle>
                        <CardDescription>Summary information about the {collection.name} collection</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold mb-1">Document Count</h3>
                            <p className="text-2xl font-bold text-blue-700">{collection.count}</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="font-semibold mb-1">Fields</h3>
                            <p className="text-2xl font-bold text-green-700">{collection.fields.length}</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h3 className="font-semibold mb-1">Indexes</h3>
                            <p className="text-2xl font-bold text-purple-700">{collection.indexes?.length || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
