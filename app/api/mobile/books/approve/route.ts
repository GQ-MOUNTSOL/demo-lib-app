import { type NextRequest, NextResponse } from "next/server"

// Import shared storage
let pendingBooks: any[] = []
const approvedBooks: any[] = []

// Initialize with demo data if empty
if (pendingBooks.length === 0) {
  pendingBooks = [
    {
      id: "demo-1",
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      requestedBy: "demo-user1@example.com",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      deviceInfo: {
        platform: "iOS",
        version: "1.2.0",
      },
    },
    {
      id: "demo-2",
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      requestedBy: "demo-user2@example.com",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: "pending",
      deviceInfo: {
        platform: "Android",
        version: "1.1.5",
      },
    },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookId, action, adminId } = body

    if (!bookId || !action || !adminId) {
      return NextResponse.json({ success: false, error: "bookId, action, and adminId are required" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "approve" or "reject"' },
        { status: 400 },
      )
    }

    const bookIndex = pendingBooks.findIndex((book) => book.id === bookId)

    if (bookIndex === -1) {
      return NextResponse.json({ success: false, error: "Book request not found" }, { status: 404 })
    }

    const book = pendingBooks[bookIndex]

    // Update book status
    const updatedBook = {
      ...book,
      status: action === "approve" ? "approved" : "rejected",
      processedBy: adminId,
      processedAt: new Date().toISOString(),
    }

    // Remove from pending
    pendingBooks.splice(bookIndex, 1)

    // Add to approved if approved
    if (action === "approve") {
      approvedBooks.unshift(updatedBook)
    }

    return NextResponse.json({
      success: true,
      book: updatedBook,
      message: `Book ${action}d successfully`,
    })
  } catch (error) {
    console.error("Error processing book approval:", error)
    return NextResponse.json({ success: false, error: "Failed to process book approval" }, { status: 500 })
  }
}
