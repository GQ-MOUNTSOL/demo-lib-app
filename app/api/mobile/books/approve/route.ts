import { type NextRequest, NextResponse } from "next/server"

// This would be imported from the pending route in a real app
// For now, we'll access the same in-memory storage
const pendingBooks: any[] = []

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
    const bookIndex = pendingBooks.findIndex((book) => book.id === bookId)

    if (bookIndex === -1) {
      return NextResponse.json({ success: false, error: "Book request not found" }, { status: 404 })
    }

    const book = pendingBooks[bookIndex]

    // Update book status
    book.status = action === "approve" ? "approved" : "rejected"
    book.processedBy = adminId
    book.processedAt = new Date().toISOString()

    // In a real app, you might move approved books to a different collection
    // For now, we'll just update the status

    return NextResponse.json({
      success: true,
      book: book,
      message: `Book ${action}d successfully`,
    })
  } catch (error) {
    console.error("Error processing book approval:", error)
    return NextResponse.json({ success: false, error: "Failed to process book approval" }, { status: 500 })
  }
}
