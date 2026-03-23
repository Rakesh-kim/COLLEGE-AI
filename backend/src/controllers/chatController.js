const OpenAI = require('openai');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * System prompt for the hostel registration AI assistant.
 * Instructs the AI to collect student info conversationally and respond with structured JSON.
 */
const SYSTEM_PROMPT = `You are "Hostel AI", a friendly and professional AI assistant for student hostel registration at our college.

Your job is to:
1. Greet the student warmly and collect their information conversationally (don't ask all at once)
2. Collect: Full Name, Roll Number, Course, Year, Branch, Phone, Parent's Phone, Blood Group, Home Address, Emergency Contact, Room Preference (single/double/triple)
3. Guide them on required documents (ID proof, admission letter, passport photo)
4. Inform them about next steps and deadlines

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "reply": "Your conversational message to the student",
  "extractedData": {
    "rollNo": null,
    "course": null,
    "year": null,
    "branch": null,
    "phone": null,
    "parentPhone": null,
    "bloodGroup": null,
    "address": null,
    "emergencyContact": null,
    "roomPreference": null
  },
  "nextStep": "what the student should do next (brief)",
  "completionHint": "percentage or description of registration completion"
}

Only include fields in extractedData that were mentioned in this message.
Use null for fields not mentioned. Be conversational, friendly, and helpful.
If the student seems confused, offer clear explanations. Use emojis occasionally to be friendly.`;

/**
 * POST /api/chat
 * Sends a student message to OpenAI, extracts structured data, updates Student record.
 */
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message too long (max 2000 chars).' });
    }

    // Fetch student and their chat history for context continuity
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Build conversation history for OpenAI (last 20 messages to stay within token limits)
    const historyMessages = student.chatHistory.slice(-20).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historyMessages,
      { role: 'user', content: message.trim() },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast + cost-effective
      messages,
      temperature: 0.7,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0].message.content;
    let aiResponse;
    try {
      aiResponse = JSON.parse(rawContent);
    } catch {
      // Fallback if JSON parsing fails
      aiResponse = { reply: rawContent, extractedData: {}, nextStep: '', completionHint: '' };
    }

    // Save user message + AI reply to chat history
    student.chatHistory.push({ role: 'user', content: message.trim() });
    student.chatHistory.push({ role: 'assistant', content: aiResponse.reply });

    // Update student profile with any extracted data
    const extracted = aiResponse.extractedData || {};
    let profileUpdated = false;
    const allowedFields = ['rollNo', 'course', 'year', 'branch', 'phone', 'parentPhone', 'bloodGroup', 'address', 'emergencyContact', 'roomPreference'];
    
    for (const field of allowedFields) {
      if (extracted[field] !== null && extracted[field] !== undefined && extracted[field] !== '') {
        student[field] = extracted[field];
        profileUpdated = true;
      }
    }

    // Update completion flags
    if (student.rollNo && student.course && student.year) student.completionFlags.academicInfo = true;
    if (student.phone && student.address) student.completionFlags.personalInfo = true;
    if (student.roomPreference) student.completionFlags.roomSelected = true;

    // Trigger notification if registration becomes pending-ready
    const wasIncomplete = student.registrationStatus === 'incomplete';
    if (
      wasIncomplete &&
      student.completionFlags.academicInfo &&
      student.completionFlags.personalInfo &&
      student.completionFlags.roomSelected
    ) {
      student.registrationStatus = 'pending';
      await Notification.create({
        userId: req.user._id,
        title: '✅ Basic Info Complete!',
        message: 'Please upload your required documents to complete your hostel registration.',
        type: 'success',
        link: '/upload',
      });
    }

    await student.save();

    logger.info(`Chat: User ${req.user._id} – profileUpdated: ${profileUpdated}`);

    res.status(200).json({
      success: true,
      reply: aiResponse.reply,
      nextStep: aiResponse.nextStep,
      completionHint: aiResponse.completionHint,
      extractedData: extracted,
      studentProfile: {
        completionFlags: student.completionFlags,
        completionPercent: student.completionPercent,
        registrationStatus: student.registrationStatus,
      },
    });
  } catch (err) {
    logger.error(`Chat error: ${err.message}`);
    // Don't expose OpenAI errors to client
    res.status(500).json({ success: false, message: 'AI assistant is temporarily unavailable. Please try again.' });
  }
};

/**
 * GET /api/chat/history
 * Returns the student's chat history.
 */
const getChatHistory = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).select('chatHistory');
    if (!student) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.status(200).json({ success: true, chatHistory: student.chatHistory });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch chat history.' });
  }
};

module.exports = { sendMessage, getChatHistory };
