import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const resume = formData.get('resume') as File
    const jobDescription = formData.get('job_description') as File
    const userId = formData.get('userId') as string
    
    // SOP handling - optional field
    const sop = formData.get('sop') as File | null
    const sopText = formData.get('sop_text') as string | null
    const sopType = formData.get('sop_type') as string | null

    // Domain Knowledge handling - optional field
    const domainKnowledge = formData.get('domain_knowledge') as File | null
    const domainKnowledgeText = formData.get('domain_knowledge_text') as string | null
    const domainKnowledgeType = formData.get('domain_knowledge_type') as string | null

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate required files
    if (!resume || !jobDescription) {
      return NextResponse.json(
        { error: 'Both resume and job description are required' },
        { status: 400 }
      )
    }

    // Validate file types for required files
    if (!resume.name.endsWith('.pdf') || !jobDescription.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Resume and job description files must be in PDF format' },
        { status: 400 }
      )
    }

    // Validate SOP file if provided
    if (sop && !sop.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'SOP file must be in PDF format' },
        { status: 400 }
      )
    }

    // Validate Domain Knowledge file if provided
    if (domainKnowledge && !domainKnowledge.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Domain Knowledge file must be in PDF format' },
        { status: 400 }
      )
    }

    // Validate file sizes (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (resume.size > MAX_SIZE || jobDescription.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Resume and job description files must be under 10MB' },
        { status: 400 }
      )
    }

    // Validate SOP file size if provided
    if (sop && sop.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'SOP file must be under 10MB' },
        { status: 400 }
      )
    }

    // Validate Domain Knowledge file size if provided
    if (domainKnowledge && domainKnowledge.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Domain Knowledge file must be under 10MB' },
        { status: 400 }
      )
    }

    // Create directory in backend
    const uploadDir = path.join(process.cwd(), '..', 'backend', 'data', 'technical_assessments', 'temp')
    await mkdir(uploadDir, { recursive: true })

    // Save required files with UUID naming
    const resumeBuffer = Buffer.from(await resume.arrayBuffer())
    const jobDescBuffer = Buffer.from(await jobDescription.arrayBuffer())

    await writeFile(join(uploadDir, `${userId}-resume.pdf`), resumeBuffer)
    await writeFile(join(uploadDir, `${userId}-jd.pdf`), jobDescBuffer)

    // Save SOP file if provided
    if (sopType === 'file' && sop) {
      const sopBuffer = Buffer.from(await sop.arrayBuffer())
      await writeFile(join(uploadDir, `${userId}-sop.pdf`), sopBuffer)
    }

    // Save SOP text if provided
    if (sopType === 'text' && sopText) {
      await writeFile(join(uploadDir, `${userId}-sop.txt`), sopText)
    }

    // Save Domain Knowledge file if provided
    if (domainKnowledgeType === 'file' && domainKnowledge) {
      const domainKnowledgeBuffer = Buffer.from(await domainKnowledge.arrayBuffer())
      await writeFile(join(uploadDir, `${userId}-domain-knowledge.pdf`), domainKnowledgeBuffer)
    }

    // Save Domain Knowledge text if provided
    if (domainKnowledgeType === 'text' && domainKnowledgeText) {
      await writeFile(join(uploadDir, `${userId}-domain-knowledge.txt`), domainKnowledgeText)
    }

    const responseData: any = { 
      message: 'Files uploaded successfully',
      files_uploaded: ['resume', 'job_description']
    }

    // Add SOP info to response if provided
    if (sopType === 'file' && sop) {
      responseData.files_uploaded.push('sop_pdf')
      responseData.sop_type = 'file'
    } else if (sopType === 'text' && sopText) {
      responseData.files_uploaded.push('sop_text')
      responseData.sop_type = 'text'
      responseData.sop_length = sopText.length
    }

    // Add Domain Knowledge info to response if provided
    if (domainKnowledgeType === 'file' && domainKnowledge) {
      responseData.files_uploaded.push('domain_knowledge_pdf')
      responseData.domain_knowledge_type = 'file'
    } else if (domainKnowledgeType === 'text' && domainKnowledgeText) {
      responseData.files_uploaded.push('domain_knowledge_text')
      responseData.domain_knowledge_type = 'text'
      responseData.domain_knowledge_length = domainKnowledgeText.length
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}

// Configure body size limit
export const config = {
  api: {
    bodyParser: false,
  }
} 