import { type NextRequest, NextResponse } from "next/server"

// Shared storage arrays
const approvedBooks: any[] = []
const rejectedBooks: any[] = []

// Import pending books from the pending route
import { pendingBooks } from "../pending/route"

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

    // Find the book in pending requests
    const bookIndex = pendingBooks.findIndex((book) => book.id === bookId && book.status === "pending")

    if (bookIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Book request not found or already processed" },
        { status: 404 },
      )
    }

    const book = pendingBooks[bookIndex]

    // Update book status
    const updatedBook = {
      ...book,
      status: action === "approve" ? "approved" : "rejected",
      processedBy: adminId,
      processedAt: new Date().toISOString(),
    }

    // Update the book in the pending array
    pendingBooks[bookIndex] = updatedBook

    // Add to appropriate array
    if (action === "approve") {
      approvedBooks.push(updatedBook)
    } else {
      rejectedBooks.push(updatedBook)
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

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      approved: approvedBooks,
      rejected: rejectedBooks,
      total: approvedBooks.length + rejectedBooks.length,
    })
  } catch (error) {
    console.error("Error fetching processed books:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch processed books" }, { status: 500 })
  }
}

// Export the shared data
export { approvedBooks, rejectedBooks }
