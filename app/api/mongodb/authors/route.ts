error: "Failed to fetch authors from MongoDB",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    
    // Insert new author
    const result = await db.collection("authors").insertOne({
      name: body.name,
      nationality: body.nationality,
      era: body.era,
      bio: body.bio,
      created_at: new Date(),
      updated_at: new Date()
    })

    return NextResponse.json({
      success: true,
      message: "Author created successfully",
      id: result.insertedId.toString()
    })

  } catch (error) {
    console.error("Error creating author:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create author",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
