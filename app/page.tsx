"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookManagement } from "./components/book-management"
import { AuthorManagement } from "./components/author-management"
import { GenreManagement } from "./components/genre-management"
import { WebhookStatus } from "./components/webhook-status"
import { Book, Users, Tag, Webhook, AlertTriangle, Database, Smartphone } from "lucide-react"
import { MakeIntegration } from "./components/make-integration"
import { DebugPanel } from "./components/debug-panel"
import { MongoDBStatus } from "./components/mongodb-status"
import { AuthorTestDisplay } from "./components/author-test-display"
import Link from "next/link"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Management Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage your book catalog, authors, and Make.com integrations</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access key features and management tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/mobile-requests">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
                  >
                    <Smartphone className="h-6 w-6" />
                    <span>Mobile Requests</span>
                    <span className="text-xs text-gray-500">Manage mobile app book requests</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
                  disabled
                >
                  <Webhook className="h-6 w-6" />
                  <span>Make.com Integration</span>
                  <span className="text-xs text-gray-500">Configure automation workflows</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
                  disabled
                >
                  <Database className="h-6 w-6" />
                  <span>Database Management</span>
                  <span className="text-xs text-gray-500">Manage books and authors</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <WebhookStatus />
        <MongoDBStatus />

        <Tabs defaultValue="books" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
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
            <TabsTrigger value="test-db" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Test DB
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

          <TabsContent value="test-db">
            <AuthorTestDisplay />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
