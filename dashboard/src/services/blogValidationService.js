/**
 * Blog Validation Service
 * Comprehensive validation for blog posts with real-time feedback,
 * SEO optimization checks, and content quality analysis
 */

class BlogValidationService {
  constructor() {
    this.validationRules = {
      title: {
        minLength: 10,
        maxLength: 100,
        required: true,
        pattern: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
        seoOptimal: { min: 30, max: 60 }
      },
      content: {
        minLength: 100,
        maxLength: 50000,
        required: true,
        minWords: 50,
        maxWords: 10000
      },
      excerpt: {
        minLength: 50,
        maxLength: 300,
        required: true,
        seoOptimal: { min: 120, max: 160 }
      },
      category: {
        required: true,
        allowedValues: [
          'Web Development',
          'Mobile Development',
          'Data Science',
          'AI/ML',
          'DevOps',
          'UI/UX Design',
          'Backend Development',
          'Frontend Development',
          'Full Stack Development',
          'Technology News',
          'Programming Tips',
          'Career Advice',
          'Industry Insights',
          'Tutorial',
          'Review',
          'Opinion',
          'Case Study',
          'Best Practices',
          'Tools & Resources',
          'Open Source'
        ]
      },
      tags: {
        minCount: 1,
        maxCount: 10,
        maxTagLength: 30,
        pattern: /^[a-zA-Z0-9\s\-_]+$/
      },
      featuredImage: {
        required: false,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        maxSize: 5 * 1024 * 1024, // 5MB
        minDimensions: { width: 400, height: 200 },
        optimalDimensions: { width: 1200, height: 630 } // Open Graph optimal
      },
      seo: {
        metaTitle: { minLength: 30, maxLength: 60 },
        metaDescription: { minLength: 120, maxLength: 160 },
        canonicalUrl: { pattern: /^https?:\/\/.+/ }
      }
    };

    this.contentQualityChecks = {
      readability: true,
      grammarBasic: true,
      duplicateContent: true,
      linkValidation: true,
      imageOptimization: true,
      seoScore: true
    };
  }

  /**
   * Validate complete blog post
   */
  async validatePost(postData, options = {}) {
    const {
      skipContentQuality = false,
      skipSEOChecks = false,
      validateForPublishing = false
    } = options;

    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      scores: {
        overall: 0,
        content: 0,
        seo: 0,
        readability: 0
      },
      details: {}
    };

    try {
      // Basic field validation
      const fieldValidation = await this.validateFields(postData);
      this.mergeValidationResults(validation, fieldValidation);

      // Content quality checks
      if (!skipContentQuality) {
        const qualityValidation = await this.validateContentQuality(postData);
        this.mergeValidationResults(validation, qualityValidation);
      }

      // SEO validation
      if (!skipSEOChecks) {
        const seoValidation = await this.validateSEO(postData);
        this.mergeValidationResults(validation, seoValidation);
      }

      // Publishing-specific validation
      if (validateForPublishing) {
        const publishValidation = await this.validateForPublishing(postData);
        this.mergeValidationResults(validation, publishValidation);
      }

      // Calculate overall score
      validation.scores.overall = this.calculateOverallScore(validation.scores);
      validation.isValid = validation.errors.length === 0;

      return validation;
    } catch (error) {
      console.error('Validation error:', error);
      validation.isValid = false;
      validation.errors.push({
        field: 'system',
        message: 'Validation system error',
        type: 'error'
      });
      return validation;
    }
  }

  /**
   * Validate individual fields
   */
  async validateFields(postData) {
    const validation = {
      errors: [],
      warnings: [],
      suggestions: [],
      scores: { content: 0 },
      details: {}
    };

    // Title validation
    const titleValidation = this.validateTitle(postData.title);
    this.addValidationResults(validation, 'title', titleValidation);

    // Content validation
    const contentValidation = this.validateContent(postData.content);
    this.addValidationResults(validation, 'content', contentValidation);

    // Excerpt validation
    const excerptValidation = this.validateExcerpt(postData.excerpt);
    this.addValidationResults(validation, 'excerpt', excerptValidation);

    // Category validation
    const categoryValidation = this.validateCategory(postData.category);
    this.addValidationResults(validation, 'category', categoryValidation);

    // Tags validation
    const tagsValidation = this.validateTags(postData.tags);
    this.addValidationResults(validation, 'tags', tagsValidation);

    // Featured image validation
    if (postData.featuredImage) {
      const imageValidation = await this.validateFeaturedImage(postData.featuredImage);
      this.addValidationResults(validation, 'featuredImage', imageValidation);
    }

    validation.scores.content = this.calculateContentScore(validation);
    return validation;
  }

  /**
   * Validate title
   */
  validateTitle(title) {
    const result = { errors: [], warnings: [], suggestions: [], score: 0 };
    const rules = this.validationRules.title;

    if (!title || title.trim().length === 0) {
      result.errors.push({
        message: 'Title is required',
        type: 'required'
      });
      return result;
    }

    const trimmedTitle = title.trim();
    const length = trimmedTitle.length;

    // Length validation
    if (length < rules.minLength) {
      result.errors.push({
        message: `Title must be at least ${rules.minLength} characters (current: ${length})`,
        type: 'minLength'
      });
    } else if (length > rules.maxLength) {
      result.errors.push({
        message: `Title must not exceed ${rules.maxLength} characters (current: ${length})`,
        type: 'maxLength'
      });
    }

    // SEO optimal length
    if (length < rules.seoOptimal.min || length > rules.seoOptimal.max) {
      result.warnings.push({
        message: `For better SEO, title should be ${rules.seoOptimal.min}-${rules.seoOptimal.max} characters`,
        type: 'seoLength'
      });
    }

    // Pattern validation
    if (!rules.pattern.test(trimmedTitle)) {
      result.warnings.push({
        message: 'Title contains special characters that may affect SEO',
        type: 'pattern'
      });
    }

    // Additional checks
    if (trimmedTitle.toLowerCase() === trimmedTitle) {
      result.suggestions.push({
        message: 'Consider using title case for better readability',
        type: 'titleCase'
      });
    }

    if (!/[0-9]/.test(trimmedTitle) && !/\b(how|what|why|when|where|guide|tutorial|tips)\b/i.test(trimmedTitle)) {
      result.suggestions.push({
        message: 'Consider adding numbers or question words to increase engagement',
        type: 'engagement'
      });
    }

    result.score = this.calculateFieldScore('title', result, length);
    return result;
  }

  /**
   * Validate content
   */
  validateContent(content) {
    const result = { errors: [], warnings: [], suggestions: [], score: 0 };
    const rules = this.validationRules.content;

    if (!content || content.trim().length === 0) {
      result.errors.push({
        message: 'Content is required',
        type: 'required'
      });
      return result;
    }

    const trimmedContent = content.trim();
    const length = trimmedContent.length;
    const wordCount = this.countWords(trimmedContent);
    const readTime = Math.ceil(wordCount / 200); // Average reading speed

    // Length validation
    if (length < rules.minLength) {
      result.errors.push({
        message: `Content must be at least ${rules.minLength} characters (current: ${length})`,
        type: 'minLength'
      });
    } else if (length > rules.maxLength) {
      result.errors.push({
        message: `Content must not exceed ${rules.maxLength} characters (current: ${length})`,
        type: 'maxLength'
      });
    }

    // Word count validation
    if (wordCount < rules.minWords) {
      result.warnings.push({
        message: `Content should have at least ${rules.minWords} words (current: ${wordCount})`,
        type: 'minWords'
      });
    } else if (wordCount > rules.maxWords) {
      result.warnings.push({
        message: `Content is quite long (${wordCount} words, ~${readTime} min read)`,
        type: 'maxWords'
      });
    }

    // Structure checks
    const headingCount = (trimmedContent.match(/<h[1-6][^>]*>/gi) || []).length;
    if (wordCount > 300 && headingCount === 0) {
      result.suggestions.push({
        message: 'Consider adding headings to improve content structure',
        type: 'structure'
      });
    }

    // Link checks
    const linkCount = (trimmedContent.match(/<a[^>]*href/gi) || []).length;
    if (wordCount > 500 && linkCount === 0) {
      result.suggestions.push({
        message: 'Consider adding relevant links to improve SEO and user experience',
        type: 'links'
      });
    }

    // Image checks
    const imageCount = (trimmedContent.match(/<img[^>]*src/gi) || []).length;
    if (wordCount > 800 && imageCount === 0) {
      result.suggestions.push({
        message: 'Consider adding images to break up long text and improve engagement',
        type: 'images'
      });
    }

    result.score = this.calculateFieldScore('content', result, wordCount);
    return result;
  }

  /**
   * Validate excerpt
   */
  validateExcerpt(excerpt) {
    const result = { errors: [], warnings: [], suggestions: [], score: 0 };
    const rules = this.validationRules.excerpt;

    if (!excerpt || excerpt.trim().length === 0) {
      result.errors.push({
        message: 'Excerpt is required',
        type: 'required'
      });
      return result;
    }

    const trimmedExcerpt = excerpt.trim();
    const length = trimmedExcerpt.length;

    // Length validation
    if (length < rules.minLength) {
      result.errors.push({
        message: `Excerpt must be at least ${rules.minLength} characters (current: ${length})`,
        type: 'minLength'
      });
    } else if (length > rules.maxLength) {
      result.errors.push({
        message: `Excerpt must not exceed ${rules.maxLength} characters (current: ${length})`,
        type: 'maxLength'
      });
    }

    // SEO optimal length
    if (length < rules.seoOptimal.min || length > rules.seoOptimal.max) {
      result.warnings.push({
        message: `For better SEO, excerpt should be ${rules.seoOptimal.min}-${rules.seoOptimal.max} characters`,
        type: 'seoLength'
      });
    }

    // Quality checks
    if (trimmedExcerpt.endsWith('...') || trimmedExcerpt.endsWith('…')) {
      result.suggestions.push({
        message: 'Avoid ending excerpt with ellipsis for better user experience',
        type: 'ellipsis'
      });
    }

    result.score = this.calculateFieldScore('excerpt', result, length);
    return result;
  }

  /**
   * Validate category
   */
  validateCategory(category) {
    const result = { errors: [], warnings: [], suggestions: [], score: 0 };
    const rules = this.validationRules.category;

    if (!category || category.trim().length === 0) {
      result.errors.push({
        message: 'Category is required',
        type: 'required'
      });
      return result;
    }

    if (!rules.allowedValues.includes(category)) {
      result.errors.push({
        message: `Invalid category. Must be one of: ${rules.allowedValues.join(', ')}`,
        type: 'invalidValue'
      });
    }

    result.score = result.errors.length === 0 ? 100 : 0;
    return result;
  }

  /**
   * Validate tags
   */
  validateTags(tags) {
    const result = { errors: [], warnings: [], suggestions: [], score: 0 };
    const rules = this.validationRules.tags;

    let tagArray = [];
    if (typeof tags === 'string') {
      tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else if (Array.isArray(tags)) {
      tagArray = tags.filter(tag => tag && tag.trim().length > 0);
    }

    // Count validation
    if (tagArray.length < rules.minCount) {
      result.errors.push({
        message: `At least ${rules.minCount} tag is required`,
        type: 'minCount'
      });
    } else if (tagArray.length > rules.maxCount) {
      result.warnings.push({
        message: `Too many tags (${tagArray.length}). Consider using ${rules.maxCount} or fewer for better SEO`,
        type: 'maxCount'
      });
    }

    // Individual tag validation
    tagArray.forEach((tag, index) => {
      if (tag.length > rules.maxTagLength) {
        result.warnings.push({
          message: `Tag "${tag}" is too long (max ${rules.maxTagLength} characters)`,
          type: 'tagLength'
        });
      }

      if (!rules.pattern.test(tag)) {
        result.warnings.push({
          message: `Tag "${tag}" contains invalid characters`,
          type: 'tagPattern'
        });
      }
    });

    // Duplicate check
    const uniqueTags = [...new Set(tagArray.map(tag => tag.toLowerCase()))];
    if (uniqueTags.length !== tagArray.length) {
      result.warnings.push({
        message: 'Duplicate tags detected',
        type: 'duplicates'
      });
    }

    result.score = this.calculateFieldScore('tags', result, tagArray.length);
    return result;
  }

  /**
   * Validate featured image
   */
  async validateFeaturedImage(imageUrl) {
    const result = { errors: [], warnings: [], suggestions: [], score: 0 };
    const rules = this.validationRules.featuredImage;

    if (!imageUrl || imageUrl.trim().length === 0) {
      return result; // Optional field
    }

    try {
      // URL validation
      const url = new URL(imageUrl);
      
      // Format validation
      const extension = url.pathname.split('.').pop().toLowerCase();
      if (!rules.allowedFormats.includes(extension)) {
        result.warnings.push({
          message: `Image format "${extension}" may not be optimal. Recommended: ${rules.allowedFormats.join(', ')}`,
          type: 'format'
        });
      }

      // WebP recommendation
      if (extension !== 'webp' && extension !== 'svg') {
        result.suggestions.push({
          message: 'Consider using WebP format for better performance',
          type: 'webp'
        });
      }

      result.score = 80; // Base score for valid image
    } catch (error) {
      result.errors.push({
        message: 'Invalid image URL',
        type: 'invalidUrl'
      });
    }

    return result;
  }

  /**
   * Validate content quality
   */
  async validateContentQuality(postData) {
    const validation = {
      errors: [],
      warnings: [],
      suggestions: [],
      scores: { readability: 0 },
      details: {}
    };

    // Readability analysis
    const readabilityScore = this.analyzeReadability(postData.content);
    validation.scores.readability = readabilityScore;
    validation.details.readability = {
      score: readabilityScore,
      level: this.getReadabilityLevel(readabilityScore)
    };

    if (readabilityScore < 60) {
      validation.warnings.push({
        field: 'content',
        message: 'Content may be difficult to read. Consider shorter sentences and simpler words.',
        type: 'readability'
      });
    }

    // Grammar and spelling (basic checks)
    const grammarIssues = this.basicGrammarCheck(postData.content);
    if (grammarIssues.length > 0) {
      validation.suggestions.push({
        field: 'content',
        message: `Potential grammar issues found: ${grammarIssues.join(', ')}`,
        type: 'grammar'
      });
    }

    return validation;
  }

  /**
   * Validate SEO aspects
   */
  async validateSEO(postData) {
    const validation = {
      errors: [],
      warnings: [],
      suggestions: [],
      scores: { seo: 0 },
      details: {}
    };

    let seoScore = 0;
    const checks = [];

    // Title SEO
    if (postData.title && postData.title.length >= 30 && postData.title.length <= 60) {
      seoScore += 20;
      checks.push('Title length optimal');
    } else {
      validation.warnings.push({
        field: 'title',
        message: 'Title length not optimal for SEO (30-60 characters recommended)',
        type: 'seoTitle'
      });
    }

    // Excerpt/Meta description SEO
    if (postData.excerpt && postData.excerpt.length >= 120 && postData.excerpt.length <= 160) {
      seoScore += 20;
      checks.push('Meta description length optimal');
    } else {
      validation.warnings.push({
        field: 'excerpt',
        message: 'Excerpt length not optimal for meta description (120-160 characters recommended)',
        type: 'seoDescription'
      });
    }

    // Content length SEO
    const wordCount = this.countWords(postData.content || '');
    if (wordCount >= 300) {
      seoScore += 15;
      checks.push('Content length sufficient');
    } else {
      validation.warnings.push({
        field: 'content',
        message: 'Content may be too short for good SEO (300+ words recommended)',
        type: 'seoContentLength'
      });
    }

    // Headings structure
    const headings = this.analyzeHeadingStructure(postData.content || '');
    if (headings.hasH1 && headings.hasSubheadings) {
      seoScore += 15;
      checks.push('Good heading structure');
    } else {
      validation.suggestions.push({
        field: 'content',
        message: 'Improve heading structure with H1 and subheadings (H2, H3)',
        type: 'seoHeadings'
      });
    }

    // Featured image
    if (postData.featuredImage) {
      seoScore += 10;
      checks.push('Featured image present');
    } else {
      validation.suggestions.push({
        field: 'featuredImage',
        message: 'Add a featured image to improve social media sharing',
        type: 'seoImage'
      });
    }

    // Tags
    const tagCount = Array.isArray(postData.tags) ? postData.tags.length : 
                    (postData.tags ? postData.tags.split(',').length : 0);
    if (tagCount >= 3 && tagCount <= 8) {
      seoScore += 10;
      checks.push('Good tag usage');
    } else {
      validation.suggestions.push({
        field: 'tags',
        message: 'Use 3-8 relevant tags for better SEO',
        type: 'seoTags'
      });
    }

    // Internal/external links
    const linkAnalysis = this.analyzeLinkStructure(postData.content || '');
    if (linkAnalysis.hasLinks) {
      seoScore += 10;
      checks.push('Contains links');
    } else {
      validation.suggestions.push({
        field: 'content',
        message: 'Add relevant internal and external links',
        type: 'seoLinks'
      });
    }

    validation.scores.seo = seoScore;
    validation.details.seo = {
      score: seoScore,
      checks,
      maxScore: 100
    };

    return validation;
  }

  /**
   * Validate for publishing
   */
  async validateForPublishing(postData) {
    const validation = {
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Required fields for publishing
    const requiredFields = ['title', 'content', 'excerpt', 'category'];
    requiredFields.forEach(field => {
      if (!postData[field] || postData[field].toString().trim().length === 0) {
        validation.errors.push({
          field,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required for publishing`,
          type: 'publishRequired'
        });
      }
    });

    // Minimum content quality for publishing
    const wordCount = this.countWords(postData.content || '');
    if (wordCount < 200) {
      validation.errors.push({
        field: 'content',
        message: 'Content must have at least 200 words for publishing',
        type: 'publishMinContent'
      });
    }

    // SEO readiness
    if (!postData.featuredImage) {
      validation.warnings.push({
        field: 'featuredImage',
        message: 'Featured image recommended for better social media sharing',
        type: 'publishSEO'
      });
    }

    return validation;
  }

  /**
   * Real-time validation for form fields
   */
  validateFieldRealTime(fieldName, value, postData = {}) {
    switch (fieldName) {
      case 'title':
        return this.validateTitle(value);
      case 'content':
        return this.validateContent(value);
      case 'excerpt':
        return this.validateExcerpt(value);
      case 'category':
        return this.validateCategory(value);
      case 'tags':
        return this.validateTags(value);
      default:
        return { errors: [], warnings: [], suggestions: [], score: 100 };
    }
  }

  // Helper methods

  countWords(text) {
    if (!text) return 0;
    // Remove HTML tags and count words
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleanText ? cleanText.split(' ').length : 0;
  }

  analyzeReadability(content) {
    if (!content) return 0;
    
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  countSyllables(word) {
    if (!word) return 0;
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    if (word.endsWith('e')) count--;
    return Math.max(1, count);
  }

  getReadabilityLevel(score) {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  basicGrammarCheck(content) {
    if (!content) return [];
    
    const issues = [];
    const text = content.replace(/<[^>]*>/g, ' ');
    
    // Basic checks
    if (/\s{2,}/.test(text)) {
      issues.push('Multiple consecutive spaces');
    }
    
    if (/[.!?]\s*[a-z]/.test(text)) {
      issues.push('Sentences not properly capitalized');
    }
    
    if (/\b(teh|adn|nad|hte)\b/gi.test(text)) {
      issues.push('Common typos detected');
    }
    
    return issues;
  }

  analyzeHeadingStructure(content) {
    if (!content) return { hasH1: false, hasSubheadings: false };
    
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    const subheadingCount = (content.match(/<h[2-6][^>]*>/gi) || []).length;
    
    return {
      hasH1: h1Count > 0,
      hasSubheadings: subheadingCount > 0,
      h1Count,
      subheadingCount
    };
  }

  analyzeLinkStructure(content) {
    if (!content) return { hasLinks: false, linkCount: 0 };
    
    const links = content.match(/<a[^>]*href[^>]*>/gi) || [];
    
    return {
      hasLinks: links.length > 0,
      linkCount: links.length
    };
  }

  calculateFieldScore(fieldName, validation, value) {
    let score = 100;
    
    // Deduct points for errors and warnings
    score -= validation.errors.length * 30;
    score -= validation.warnings.length * 15;
    score -= validation.suggestions.length * 5;
    
    return Math.max(0, score);
  }

  calculateContentScore(validation) {
    const totalFields = Object.keys(validation.details || {}).length || 1;
    const totalScore = Object.values(validation.details || {}).reduce((sum, detail) => {
      return sum + (detail.score || 0);
    }, 0);
    
    return Math.round(totalScore / totalFields);
  }

  calculateOverallScore(scores) {
    const weights = {
      content: 0.4,
      seo: 0.3,
      readability: 0.3
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([key, weight]) => {
      if (scores[key] !== undefined) {
        totalScore += scores[key] * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  mergeValidationResults(target, source) {
    target.errors.push(...(source.errors || []));
    target.warnings.push(...(source.warnings || []));
    target.suggestions.push(...(source.suggestions || []));
    
    if (source.scores) {
      Object.assign(target.scores, source.scores);
    }
    
    if (source.details) {
      Object.assign(target.details, source.details);
    }
  }

  addValidationResults(validation, fieldName, fieldValidation) {
    // Add field name to all messages
    const addField = (items) => items.map(item => ({ ...item, field: fieldName }));
    
    validation.errors.push(...addField(fieldValidation.errors || []));
    validation.warnings.push(...addField(fieldValidation.warnings || []));
    validation.suggestions.push(...addField(fieldValidation.suggestions || []));
    
    if (fieldValidation.score !== undefined) {
      validation.details[fieldName] = { score: fieldValidation.score };
    }
  }

  /**
   * Get validation summary for UI display
   */
  getValidationSummary(validation) {
    return {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      suggestionCount: validation.suggestions.length,
      overallScore: validation.scores.overall,
      canPublish: validation.errors.length === 0,
      readabilityLevel: this.getReadabilityLevel(validation.scores.readability || 0)
    };
  }
}

const blogValidationService = new BlogValidationService();
export default blogValidationService;