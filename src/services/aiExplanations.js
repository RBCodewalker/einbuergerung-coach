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
    // Even more permissive mobile detection - let more devices try WebLLM
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isSmallMobile = /iPhone|Android.*Mobile|BlackBerry|IEMobile/i.test(userAgent) && window.innerWidth <= 480;
    
    
    // Only restrict very small mobile phones (under 480px width)
    return isSmallMobile;
  }

  get initializationProgress() {
    return this._initializationProgress || 0;
  }

  set initializationProgress(value) {
    this._initializationProgress = value;
  }

  checkWebLLMSupport() {
    // Check for essential WebLLM requirements
    const hasWasm = typeof WebAssembly !== 'undefined';
    const hasWebGPU = navigator.gpu !== undefined;
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    const hasWorker = typeof Worker !== 'undefined';
    

    // WebLLM requires WebAssembly at minimum, WebGPU is preferred but not required
    return hasWasm && hasWorker;
  }

  async initialize(forceRetry = false) {
    if (this.isInitialized && !forceRetry) {
      return;
    }

    if (this.initializationPromise && !forceRetry) {
      return this.initializationPromise;
    }

    // Clear previous state if forcing retry
    if (forceRetry) {
      this.isInitialized = false;
      this.engine = null;
      this.initializationProgress = 0;
      this.initializationPromise = null;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  async _doInitialize() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.initializationProgress = 0;

    // Check WebLLM browser compatibility first
    const isWebLLMSupported = this.checkWebLLMSupport();
    if (!isWebLLMSupported) {
      throw new Error("WebLLM is not supported in this browser environment");
    }

    try {
      // Reset state
      this.engine = null;
      this.isInitialized = false;

      // Even more aggressive mobile optimization - try ultra-small models first
      const models = this.isMobile ? [
        // Ultra-small models for very constrained devices
        "Phi-3-mini-4k-instruct-q4f16_1-MLC", // Try Microsoft's tiny model first
        "Qwen2-0.5B-Instruct-q4f16_1-MLC",
        "TinyLlama-1.1B-Chat-v0.4-q0f16-MLC" // Even more compressed version
      ] : [
        // Start small even on desktop for reliability
        "Qwen2-0.5B-Instruct-q4f16_1-MLC",
        "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC",
        "Phi-3-mini-4k-instruct-q4f16_1-MLC",
        "gemma-2b-it-q4f32_1-MLC"
      ];

      const initProgressCallback = (report) => {
        this.initializationProgress = report.progress || 0;
      };

      // Try models in order until one works
      for (const modelId of models) {
        try {

          this.engine = new webllm.MLCEngine();

          // Add mobile-optimized configuration
          const config = this.isMobile ? {
            // More aggressive mobile optimizations
            use_cache: true,
            max_gen_len: 100, // Shorter responses on mobile
            low_resource_mode: true, // Enable if available
            mean_gen_len: 50,
            shift_fill_factor: 0.3
          } : {
            use_cache: true
          };
          
          const reloadPromise = this.engine.reload(modelId, {
            initProgressCallback: initProgressCallback,
            config: config,
          });

          // Even more generous timeouts for mobile - give mobile devices more time
          const timeoutMs = this.isMobile ? 300000 : 90000; // 5min mobile, 1.5min desktop
          
          let result;
          try {
            // Try without timeout first (some mobile browsers need more time)
            result = await Promise.race([
              reloadPromise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Model loading timeout after ${timeoutMs/1000}s`)), timeoutMs)
              )
            ]);
          } catch (timeoutError) {
            if (timeoutError.message.includes('timeout')) {
              console.warn(`Model ${modelId} timed out, continuing with verification`);
              // Don't immediately fail - try to verify if the model actually loaded
            } else {
              throw timeoutError;
            }
          }

          // Verify the engine is working with a test
          const testResult = await this.engine.chat.completions.create({
            messages: [{ role: "user", content: "Test" }],
            temperature: 0.1,
            max_tokens: 5,
          });

          if (!testResult?.choices?.[0]?.message?.content) {
            throw new Error("Model test failed - no response");
          }

          this.isInitialized = true;
          break;
        } catch (modelError) {
          this.engine = null;
          
          // On mobile, provide more specific error context
          if (this.isMobile && modelError.message.includes('timeout')) {
          }
          
          continue;
        }
      }

      if (!this.isInitialized) {

        const errorMsg = this.isMobile 
          ? "WebLLM requires WebAssembly and sufficient device resources. Some mobile browsers may not support all required features. The app continues to work without AI explanations."
          : "AI models failed to initialize. The app continues to work without AI explanations.";
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("WebLLM initialization failed:", error.message);
      this.isInitialized = false;
      this.engine = null;
      this.initializationProgress = 0;
      
      // Provide more helpful error context
      if (this.isMobile) {
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


    try {
      // Wait for initialization if it's in progress
      if (this.initializationPromise) {
        await this.initializationPromise;
      }

      // Try to initialize if not done yet
      if (!this.isInitialized && !this.initializationPromise) {
        await this.initialize();
      }

      // Double-check that everything is ready
      if (!this.isInitialized || !this.engine) {
        throw new Error("AI model not available");
      }

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
        return explanation;
      } catch (aiError) {

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
