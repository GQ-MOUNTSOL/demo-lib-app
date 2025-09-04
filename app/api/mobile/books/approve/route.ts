import { type NextRequest, NextResponse } from "next/server"

// Import the same storage as pending route
// In a real app, this would be a shared database
const pendingBooks: any[] = []
const approvedBooks: any[] = []
const rejectedBooks: any[] = []

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

    // Get the current pending books from the other route
    const pendingResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/mobile/books/pending`,
    )
    const pendingData = await pendingResponse.json()

    if (!pendingData.success) {
      return NextResponse.json({ success: false, error: "Failed to fetch pending books" }, { status: 500 })
    }

    const book = pendingData.books.find((b: any) => b.id === bookId)

    if (!book) {
      return NextResponse.json({ success: false, error: "Book request not found" }, { status: 404 })
    }

    // Update book status
    const updatedBook = {
      ...book,
      status: action === "approve" ? "approved" : "rejected",
      processedBy: adminId,
      processedAt: new Date().toISOString(),
    }

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
    })
  } catch (error) {
    console.error("Error fetching processed books:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch processed books" }, { status: 500 })
  }
}
