import * as webllm from "@mlc-ai/web-llm";

class AIExplanationService {
  constructor() {
    this.engine = null;
    this.isLoading = false;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.isMobile = this.detectMobile();
    this.initializationProgress = 0;
  }

  detectMobile() {
    // Detect mobile devices
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /android|iPhone|iPad|iPod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    
    return isMobileUA || (isTouchDevice && isSmallScreen);
  }

  get initializationProgress() {
    return this._initializationProgress || 0;
  }

  set initializationProgress(value) {
    this._initializationProgress = value;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  async _doInitialize() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.initializationProgress = 0;
    console.log("🚀 Starting WebLLM initialization...", { isMobile: this.isMobile });

    // Check if WebLLM is supported on this device
    if (this.isMobile) {
      console.warn("📱 Mobile device detected - WebLLM may have limited support");
    }

    try {
      // Reset state
      this.engine = null;
      this.isInitialized = false;

      // Use smaller models for mobile devices
      const models = this.isMobile ? [
        "Qwen2-0.5B-Instruct-q4f16_1-MLC", // Smallest model for mobile
        "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC", // Backup for mobile
      ] : [
        "gemma-2b-it-q4f32_1-MLC", // Desktop preferred
        "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC", // Alternative
        "Qwen2-0.5B-Instruct-q4f16_1-MLC", // Smallest as fallback
      ];

      const initProgressCallback = (report) => {
        this.initializationProgress = report.progress || 0;
        console.log("📥 WebLLM loading progress:", report.text, `${this.initializationProgress}%`);
      };

      // Try models in order until one works
      for (const modelId of models) {
        try {
          console.log(`🔄 Attempting to load model: ${modelId}`);

          this.engine = new webllm.MLCEngine();

          // Add mobile-specific timeout and error handling
          const reloadPromise = this.engine.reload(modelId, {
            initProgressCallback: initProgressCallback,
            config: {
              model_url: undefined, // Let WebLLM handle the URL
              use_cache: true,
            },
          });

          // Mobile devices need longer timeout
          const timeoutMs = this.isMobile ? 60000 : 30000; // 60s for mobile, 30s for desktop
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Model loading timeout after ${timeoutMs/1000}s`)), timeoutMs)
          );

          await Promise.race([reloadPromise, timeoutPromise]);

          // Verify the engine is working with a test
          console.log("🧪 Testing model functionality...");
          const testResult = await this.engine.chat.completions.create({
            messages: [{ role: "user", content: "Test" }],
            temperature: 0.1,
            max_tokens: 5,
          });

          if (!testResult?.choices?.[0]?.message?.content) {
            throw new Error("Model test failed - no response");
          }

          this.isInitialized = true;
          console.log(
            `✅ WebLLM initialized and tested successfully with model: ${modelId}`
          );
          break;
        } catch (modelError) {
          console.warn(
            `❌ Failed to load/test ${modelId}:`,
            modelError.message,
            { isMobile: this.isMobile }
          );
          this.engine = null;
          
          // On mobile, provide more specific error context
          if (this.isMobile && modelError.message.includes('timeout')) {
            console.warn("📱 Mobile timeout - this is common on mobile devices with limited resources");
          }
          
          continue;
        }
      }

      if (!this.isInitialized) {
        const errorMsg = this.isMobile 
          ? "AI models failed to load on mobile device - this feature may not be available on your device"
          : "All AI models failed to load or test";
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("🚨 Failed to initialize any WebLLM model:", error);
      this.isInitialized = false;
      this.engine = null;
      this.initializationProgress = 0;
      
      // Provide mobile-specific error context
      if (this.isMobile) {
        console.warn("📱 Mobile device may not support WebLLM - this is a known limitation");
      }
      
      throw error;
    } finally {
      this.isLoading = false;
      this.initializationPromise = null; // Clear the promise
    }
  }

  async generateExplanation(
    question,
    options,
    correctIndex,
    userIndex = null,
    language = "de"
  ) {
    const questionText = question.question || question;
    const hasImage = question.image === true;
    const correctOption = options[correctIndex];
    const userOption = userIndex !== null ? options[userIndex] : null;
    const isCorrect = userIndex === correctIndex;

    // Skip AI explanation for image-based questions since WebLLM doesn't support vision
    if (hasImage) {
      throw new Error('Image questions not supported by current AI model');
    }

    console.log(
      `🤖 AI Explanation Request: Language=${language}, Initialized=${
        this.isInitialized
      }, Engine=${!!this.engine}`
    );

    try {
      // Wait for initialization if it's in progress
      if (this.initializationPromise) {
        console.log("⏳ Waiting for model initialization to complete...");
        await this.initializationPromise;
      }

      // Try to initialize if not done yet
      if (!this.isInitialized && !this.initializationPromise) {
        console.log("🔄 Starting model initialization...");
        await this.initialize();
      }

      // Double-check that everything is ready
      if (!this.isInitialized || !this.engine) {
        console.warn("❌ Model not properly initialized");
        throw new Error("AI model not available");
      }

      console.log("✅ Model ready, generating explanation...");
      const prompt = this.buildPrompt(
        questionText,
        options,
        correctOption,
        userOption,
        isCorrect,
        language
      );

      // Create AI request with proper error handling
      let explanation;
      try {
        const aiPromise = this.engine.chat.completions.create({
          messages: prompt,
          temperature: 0.4, // more factual, less fluff
          top_p: 0.9,
          max_tokens: 150,
        });

        // Increase timeout for more reliability
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI request timeout (8s)")), 8000)
        );

        const reply = await Promise.race([aiPromise, timeoutPromise]);
        explanation = reply.choices[0]?.message?.content?.trim();

        if (!explanation || explanation.length < 20) {
          throw new Error("AI response too short or empty");
        }

        explanation = explanation.replace(/^["']|["']$/g, "").trim();
        console.log(
          `✅ Explanation generated successfully in ${language}: ${explanation.substring(
            0,
            50
          )}...`
        );
        return explanation;
      } catch (aiError) {
        console.error("💥 AI generation error:", aiError.message);

        // Check if engine is still available after error
        if (!this.engine) {
          this.isInitialized = false;
          throw new Error("AI model became unavailable");
        }

        // Re-throw with more specific error messages
        if (aiError.message.includes("timeout")) {
          throw new Error("AI request timed out");
        } else {
          throw new Error(`AI generation failed: ${aiError.message}`);
        }
      }
    } catch (error) {
      console.error("🚨 Final error in generateExplanation:", error.message);
      throw error;
    }
  }

  buildPrompt(
    question,
    options,
    correctOption,
    userOption,
    isCorrect,
    language
  ) {
    const RULES = [
      "Do not repeat or paraphrase the instructions.",
      "Do not include headings, markdown, bold text, or labels like 'Question:' unless asked.",
      "Avoid gender references, answer neutrally.",
      "Start directly with the explanation.",
      "Make sure to reference the exact selected option and correct option (if different) in your explanation.",
      "Keep it concise: 2–4 sentences total.",
      "If uncertain, say so briefly instead of inventing facts.",
      language === "de"
        ? "Antwort ausschließlich auf Deutsch."
        : "Answer in natural, fluent English.",
      language === "de"
        ? "Kein JSON, keine Listen, nur ein kurzer Fließtext."
        : "No JSON, no lists—just a short paragraph.",
    ].join(" ");

    let task;

    if (userOption === null) {
      task =
        language === "de"
          ? `Frage: ${question}\nRichtige Antwort: ${correctOption}\nErkläre kurz, was die Frage bedeutet, und warum diese Antwort nach deutschem Recht/Geschichte korrekt ist.`
          : `Question: ${question}\nCorrect Answer: ${correctOption}\nBriefly explain what the question means and why this answer is correct in German law or history depending on context of the question.`;
    } else if (isCorrect) {
      task =
        language === "de"
          ? `Frage: ${question}\nGewählte Antwort: ${userOption} (richtig)\nErkläre kurz, was die Frage bedeutet und warum die Antwort korrekt ist, inkl. rechtlicher/historischer Bezüge.`
          : `Question: ${question}\nChosen Answer: ${userOption} (correct)\nBriefly explain what the question means and why this answer is correct with relevant legal/historical context.`;
    } else {
      task =
        language === "de"
          ? `Frage: ${question}\nGewählte Antwort: ${userOption} (falsch)\nRichtige Antwort: ${correctOption}\nErkläre kurz, was die Frage bedeutet, warum die gewählte Antwort falsch ist und warum die richtige stimmt (deutsches Recht/Geschichte).`
          : `Question: ${question}\nChosen Answer: ${userOption} (incorrect)\nCorrect Answer: ${correctOption}\nBriefly explain what the question means, why the chosen answer is wrong, and why the correct one is right (German law or history depending on context of the question).`;
    }

    return [
      { role: "system", content: RULES },
      { role: "user", content: task },
    ];
  }

  getLoadingMessage(language) {
    return language === "de"
      ? "KI-Erklärung wird generiert..."
      : "Generating AI explanation...";
  }

  getErrorMessage(language) {
    return language === "de"
      ? "Erklärung konnte nicht generiert werden."
      : "Could not generate explanation.";
  }
}

// Export singleton instance
export const aiExplanationService = new AIExplanationService();
