"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookManagement } from "./components/book-management"
import { AuthorManagement } from "./components/author-management"
import { GenreManagement } from "./components/genre-management"
import { WebhookStatus } from "./components/webhook-status"
import { Book, Users, Tag, Webhook, AlertTriangle, Database, FileSearch } from "lucide-react"
import { MakeIntegration } from "./components/make-integration"
import { DebugPanel } from "./components/debug-panel"
import { MongoDBStatus } from "./components/mongodb-status"
import { AuthorTestDisplay } from "./components/author-test-display"
import { MongoDBSchemaExplorer } from "./components/mongodb-schema-explorer"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Management Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage your book catalog, authors, and Make.com integrations</p>
        </div>

        <WebhookStatus />
        <MongoDBStatus />

        <Tabs defaultValue="books" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="books" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="authors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Authors
            </TabsTrigger>
            <TabsTrigger value="genres" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Genres
            </TabsTrigger>
            <TabsTrigger value="makecom" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Make.com
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Debug
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="test-db" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Test DB
            </TabsTrigger>
            <TabsTrigger value="schema" className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Schema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <BookManagement />
          </TabsContent>

          <TabsContent value="authors">
            <AuthorManagement />
          </TabsContent>

          <TabsContent value="genres">
            <GenreManagement />
          </TabsContent>

          <TabsContent value="makecom">
            <MakeIntegration />
          </TabsContent>

          <TabsContent value="debug">
            <DebugPanel />
          </TabsContent>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <CardTitle>Make.com Integration</CardTitle>
                <CardDescription>
                  Monitor and manage your Make.com webhook integrations for automatic book data processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900">Webhook Endpoint</h3>
                    <code className="text-sm text-blue-700">POST /api/webhook/book-data</code>
                    <p className="text-sm text-blue-600 mt-2">
                      Send book details to this endpoint from Make.com to automatically process and store book
                      information
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test-db">
            <AuthorTestDisplay />
          </TabsContent>

          <TabsContent value="schema">
            <MongoDBSchemaExplorer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
