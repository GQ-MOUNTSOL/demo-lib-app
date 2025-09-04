import { type NextRequest, NextResponse } from "next/server"

// This would connect to your actual database
const pendingBooks: Array<{
  id: string
  title: string
  author?: string
  requestedBy: string
  timestamp: string
  status: "pending" | "approved" | "rejected"
  deviceInfo?: any
  approvedBy?: string
  approvedAt?: string
}> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookId, action, adminId } = body

    if (!bookId || !action || !adminId) {
      return NextResponse.json({ success: false, error: "BookId, action, and adminId are required" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Action must be approve or reject" }, { status: 400 })
    }

    const bookIndex = pendingBooks.findIndex((book) => book.id === bookId)

    if (bookIndex === -1) {
      return NextResponse.json({ success: false, error: "Book not found" }, { status: 404 })
    }

    pendingBooks[bookIndex] = {
      ...pendingBooks[bookIndex],
      status: action === "approve" ? "approved" : "rejected",
      approvedBy: adminId,
      approvedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: `Book ${action}d successfully`,
      book: pendingBooks[bookIndex],
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to process book approval" }, { status: 500 })
  }
}
