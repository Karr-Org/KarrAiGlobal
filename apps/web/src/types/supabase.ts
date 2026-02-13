export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_persona: {
        Row: {
          agent_name: string | null
          agent_role: string | null
          blocked_topics: string[] | null
          created_at: string | null
          fallback_message: string | null
          greeting_message: string | null
          id: string
          organization_name: string | null
          product_id: string
          system_instructions: string | null
          tone: string | null
          updated_at: string | null
          website_crawl_status: string | null
          website_last_crawled_at: string | null
          website_pages_indexed: number | null
          website_url: string | null
        }
        Insert: {
          agent_name?: string | null
          agent_role?: string | null
          blocked_topics?: string[] | null
          created_at?: string | null
          fallback_message?: string | null
          greeting_message?: string | null
          id?: string
          organization_name?: string | null
          product_id: string
          system_instructions?: string | null
          tone?: string | null
          updated_at?: string | null
          website_crawl_status?: string | null
          website_last_crawled_at?: string | null
          website_pages_indexed?: number | null
          website_url?: string | null
        }
        Update: {
          agent_name?: string | null
          agent_role?: string | null
          blocked_topics?: string[] | null
          created_at?: string | null
          fallback_message?: string | null
          greeting_message?: string | null
          id?: string
          organization_name?: string | null
          product_id?: string
          system_instructions?: string | null
          tone?: string | null
          updated_at?: string | null
          website_crawl_status?: string | null
          website_last_crawled_at?: string | null
          website_pages_indexed?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_persona_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_blog_posts: {
        Row: {
          aeo_score: number | null
          author_id: string | null
          avg_time_on_page: number | null
          bounce_rate: number | null
          canonical_url: string | null
          category: string | null
          comments_count: number | null
          content: string | null
          content_html: string | null
          created_at: string | null
          definitions: Json | null
          excerpt: string | null
          external_urls: Json | null
          faqs: Json | null
          featured_image: string | null
          id: string
          idea_id: string | null
          key_takeaways: string[] | null
          keywords: string[] | null
          keywords_ranked: Json | null
          llm_citations: number | null
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          product_id: string
          publish_to: string[] | null
          published_at: string | null
          read_time_minutes: number | null
          readability_score: number | null
          related_posts: string[] | null
          scheduled_for: string | null
          scroll_depth: number | null
          seo_score: number | null
          shares: number | null
          slug: string
          status: string | null
          structured_data: Json | null
          tags: string[] | null
          title: string
          unique_visitors: number | null
          updated_at: string | null
          version: number | null
          views: number | null
          word_count: number | null
        }
        Insert: {
          aeo_score?: number | null
          author_id?: string | null
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          canonical_url?: string | null
          category?: string | null
          comments_count?: number | null
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          definitions?: Json | null
          excerpt?: string | null
          external_urls?: Json | null
          faqs?: Json | null
          featured_image?: string | null
          id?: string
          idea_id?: string | null
          key_takeaways?: string[] | null
          keywords?: string[] | null
          keywords_ranked?: Json | null
          llm_citations?: number | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          product_id: string
          publish_to?: string[] | null
          published_at?: string | null
          read_time_minutes?: number | null
          readability_score?: number | null
          related_posts?: string[] | null
          scheduled_for?: string | null
          scroll_depth?: number | null
          seo_score?: number | null
          shares?: number | null
          slug: string
          status?: string | null
          structured_data?: Json | null
          tags?: string[] | null
          title: string
          unique_visitors?: number | null
          updated_at?: string | null
          version?: number | null
          views?: number | null
          word_count?: number | null
        }
        Update: {
          aeo_score?: number | null
          author_id?: string | null
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          canonical_url?: string | null
          category?: string | null
          comments_count?: number | null
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          definitions?: Json | null
          excerpt?: string | null
          external_urls?: Json | null
          faqs?: Json | null
          featured_image?: string | null
          id?: string
          idea_id?: string | null
          key_takeaways?: string[] | null
          keywords?: string[] | null
          keywords_ranked?: Json | null
          llm_citations?: number | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          product_id?: string
          publish_to?: string[] | null
          published_at?: string | null
          read_time_minutes?: number | null
          readability_score?: number | null
          related_posts?: string[] | null
          scheduled_for?: string | null
          scroll_depth?: number | null
          seo_score?: number | null
          shares?: number | null
          slug?: string
          status?: string | null
          structured_data?: Json | null
          tags?: string[] | null
          title?: string
          unique_visitors?: number | null
          updated_at?: string | null
          version?: number | null
          views?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_blog_posts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_blog_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_social_posts: {
        Row: {
          ab_test_id: string | null
          ab_variant: string | null
          ai_model: string | null
          blog_id: string | null
          call_to_action: string | null
          carousel_slides: Json | null
          click_through_rate: number | null
          clicks: number | null
          comments: number | null
          content: string | null
          content_type: string
          content_variations: string[] | null
          created_at: string | null
          engagement_rate: number | null
          engagements: number | null
          external_post_id: string | null
          external_url: string | null
          generation_prompt: string | null
          generation_temperature: number | null
          hashtags: string[] | null
          id: string
          idea_id: string | null
          impressions: number | null
          learnings: string[] | null
          likes: number | null
          link_url: string | null
          media_urls: string[] | null
          mentions: string[] | null
          optimal_time_calculated: boolean | null
          performance_score: number | null
          platform: string
          product_id: string
          profile_visits: number | null
          published_at: string | null
          reach: number | null
          saves: number | null
          scheduled_for: string | null
          shares: number | null
          status: string | null
          thread_parts: string[] | null
          updated_at: string | null
          viral_success: boolean | null
        }
        Insert: {
          ab_test_id?: string | null
          ab_variant?: string | null
          ai_model?: string | null
          blog_id?: string | null
          call_to_action?: string | null
          carousel_slides?: Json | null
          click_through_rate?: number | null
          clicks?: number | null
          comments?: number | null
          content?: string | null
          content_type?: string
          content_variations?: string[] | null
          created_at?: string | null
          engagement_rate?: number | null
          engagements?: number | null
          external_post_id?: string | null
          external_url?: string | null
          generation_prompt?: string | null
          generation_temperature?: number | null
          hashtags?: string[] | null
          id?: string
          idea_id?: string | null
          impressions?: number | null
          learnings?: string[] | null
          likes?: number | null
          link_url?: string | null
          media_urls?: string[] | null
          mentions?: string[] | null
          optimal_time_calculated?: boolean | null
          performance_score?: number | null
          platform: string
          product_id: string
          profile_visits?: number | null
          published_at?: string | null
          reach?: number | null
          saves?: number | null
          scheduled_for?: string | null
          shares?: number | null
          status?: string | null
          thread_parts?: string[] | null
          updated_at?: string | null
          viral_success?: boolean | null
        }
        Update: {
          ab_test_id?: string | null
          ab_variant?: string | null
          ai_model?: string | null
          blog_id?: string | null
          call_to_action?: string | null
          carousel_slides?: Json | null
          click_through_rate?: number | null
          clicks?: number | null
          comments?: number | null
          content?: string | null
          content_type?: string
          content_variations?: string[] | null
          created_at?: string | null
          engagement_rate?: number | null
          engagements?: number | null
          external_post_id?: string | null
          external_url?: string | null
          generation_prompt?: string | null
          generation_temperature?: number | null
          hashtags?: string[] | null
          id?: string
          idea_id?: string | null
          impressions?: number | null
          learnings?: string[] | null
          likes?: number | null
          link_url?: string | null
          media_urls?: string[] | null
          mentions?: string[] | null
          optimal_time_calculated?: boolean | null
          performance_score?: number | null
          platform?: string
          product_id?: string
          profile_visits?: number | null
          published_at?: string | null
          reach?: number | null
          saves?: number | null
          scheduled_for?: string | null
          shares?: number | null
          status?: string | null
          thread_parts?: string[] | null
          updated_at?: string | null
          viral_success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_social_posts_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "ai_blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_social_posts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_social_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integrations: {
        Row: {
          auth_type: string | null
          base_url: string
          category: string | null
          config_schema: Json | null
          created_at: string | null
          default_config: Json | null
          description: string | null
          documentation_url: string | null
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          is_free: boolean | null
          logo_url: string | null
          name: string
          requires_user_key: boolean | null
        }
        Insert: {
          auth_type?: string | null
          base_url: string
          category?: string | null
          config_schema?: Json | null
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          documentation_url?: string | null
          icon_emoji?: string | null
          id: string
          is_active?: boolean | null
          is_free?: boolean | null
          logo_url?: string | null
          name: string
          requires_user_key?: boolean | null
        }
        Update: {
          auth_type?: string | null
          base_url?: string
          category?: string | null
          config_schema?: Json | null
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          documentation_url?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          logo_url?: string | null
          name?: string
          requires_user_key?: boolean | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string | null
          event_category: string
          event_data: Json
          event_type: string
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_category: string
          event_data: Json
          event_type: string
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_category?: string
          event_data?: Json
          event_type?: string
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_session_id: string
          citations_used: Json | null
          confidence: number | null
          confidence_score: number | null
          content: string
          content_type: string | null
          crag_confidence: number | null
          crag_verdict: string | null
          created_at: string | null
          detected_entity_id: string | null
          detected_task_id: string | null
          entities_mentioned: Json | null
          formatting_used: Json | null
          id: string
          message_index: number | null
          original_query: string | null
          query_rewrite_reason: string | null
          reasoning_data: Json | null
          reasoning_duration_ms: number | null
          reasoning_enabled: boolean | null
          response_length: number | null
          rewritten_query: string | null
          role: string
          sentiment: string | null
          sentiment_score: number | null
          session_id: string | null
          source_count: number | null
          sources: Json | null
          tokens_used: number | null
          user_feedback: string | null
          user_rating: number | null
          was_edited: boolean | null
        }
        Insert: {
          chat_session_id: string
          citations_used?: Json | null
          confidence?: number | null
          confidence_score?: number | null
          content: string
          content_type?: string | null
          crag_confidence?: number | null
          crag_verdict?: string | null
          created_at?: string | null
          detected_entity_id?: string | null
          detected_task_id?: string | null
          entities_mentioned?: Json | null
          formatting_used?: Json | null
          id?: string
          message_index?: number | null
          original_query?: string | null
          query_rewrite_reason?: string | null
          reasoning_data?: Json | null
          reasoning_duration_ms?: number | null
          reasoning_enabled?: boolean | null
          response_length?: number | null
          rewritten_query?: string | null
          role: string
          sentiment?: string | null
          sentiment_score?: number | null
          session_id?: string | null
          source_count?: number | null
          sources?: Json | null
          tokens_used?: number | null
          user_feedback?: string | null
          user_rating?: number | null
          was_edited?: boolean | null
        }
        Update: {
          chat_session_id?: string
          citations_used?: Json | null
          confidence?: number | null
          confidence_score?: number | null
          content?: string
          content_type?: string | null
          crag_confidence?: number | null
          crag_verdict?: string | null
          created_at?: string | null
          detected_entity_id?: string | null
          detected_task_id?: string | null
          entities_mentioned?: Json | null
          formatting_used?: Json | null
          id?: string
          message_index?: number | null
          original_query?: string | null
          query_rewrite_reason?: string | null
          reasoning_data?: Json | null
          reasoning_duration_ms?: number | null
          reasoning_enabled?: boolean | null
          response_length?: number | null
          rewritten_query?: string | null
          role?: string
          sentiment?: string | null
          sentiment_score?: number | null
          session_id?: string | null
          source_count?: number | null
          sources?: Json | null
          tokens_used?: number | null
          user_feedback?: string | null
          user_rating?: number | null
          was_edited?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_detected_entity_id_fkey"
            columns: ["detected_entity_id"]
            isOneToOne: false
            referencedRelation: "user_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_detected_task_id_fkey"
            columns: ["detected_task_id"]
            isOneToOne: false
            referencedRelation: "product_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          action_items: Json | null
          archive_reason: string | null
          avg_message_length: number | null
          continuation_context: string | null
          continued_from_session_id: string | null
          created_at: string | null
          dominant_sentiment: string | null
          duration_seconds: number | null
          entities_mentioned: Json | null
          expertise_signals: Json | null
          follow_up_needed: boolean | null
          follow_up_topic: string | null
          id: string
          intent_summary: string | null
          intent_type: string | null
          is_active: boolean | null
          is_pinned: boolean | null
          is_starred: boolean | null
          last_message_at: string | null
          message_count: number | null
          primary_entities: Json | null
          primary_topic: string | null
          product_id: string | null
          product_user_id: string
          resolution_status: string | null
          sentiment_journey: Json | null
          sources_used: number | null
          started_at: string | null
          summary: string | null
          summary_updated_at: string | null
          thinking_time_total: number | null
          title: string | null
          title_emoji: string | null
          topic_categories: Json | null
          topics: Json | null
          updated_at: string | null
          user_insights: Json | null
          user_message_count: number | null
        }
        Insert: {
          action_items?: Json | null
          archive_reason?: string | null
          avg_message_length?: number | null
          continuation_context?: string | null
          continued_from_session_id?: string | null
          created_at?: string | null
          dominant_sentiment?: string | null
          duration_seconds?: number | null
          entities_mentioned?: Json | null
          expertise_signals?: Json | null
          follow_up_needed?: boolean | null
          follow_up_topic?: string | null
          id?: string
          intent_summary?: string | null
          intent_type?: string | null
          is_active?: boolean | null
          is_pinned?: boolean | null
          is_starred?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          primary_entities?: Json | null
          primary_topic?: string | null
          product_id?: string | null
          product_user_id: string
          resolution_status?: string | null
          sentiment_journey?: Json | null
          sources_used?: number | null
          started_at?: string | null
          summary?: string | null
          summary_updated_at?: string | null
          thinking_time_total?: number | null
          title?: string | null
          title_emoji?: string | null
          topic_categories?: Json | null
          topics?: Json | null
          updated_at?: string | null
          user_insights?: Json | null
          user_message_count?: number | null
        }
        Update: {
          action_items?: Json | null
          archive_reason?: string | null
          avg_message_length?: number | null
          continuation_context?: string | null
          continued_from_session_id?: string | null
          created_at?: string | null
          dominant_sentiment?: string | null
          duration_seconds?: number | null
          entities_mentioned?: Json | null
          expertise_signals?: Json | null
          follow_up_needed?: boolean | null
          follow_up_topic?: string | null
          id?: string
          intent_summary?: string | null
          intent_type?: string | null
          is_active?: boolean | null
          is_pinned?: boolean | null
          is_starred?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          primary_entities?: Json | null
          primary_topic?: string | null
          product_id?: string | null
          product_user_id?: string
          resolution_status?: string | null
          sentiment_journey?: Json | null
          sources_used?: number | null
          started_at?: string | null
          summary?: string | null
          summary_updated_at?: string | null
          thinking_time_total?: number | null
          title?: string | null
          title_emoji?: string | null
          topic_categories?: Json | null
          topics?: Json | null
          updated_at?: string | null
          user_insights?: Json | null
          user_message_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "chat_sessions_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "chat_sessions_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          assigned_to: string | null
          blog_id: string | null
          created_at: string | null
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          idea_id: string | null
          notes: string | null
          platforms: string[] | null
          product_id: string
          social_post_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          blog_id?: string | null
          created_at?: string | null
          description?: string | null
          entry_date: string
          entry_type: string
          id?: string
          idea_id?: string | null
          notes?: string | null
          platforms?: string[] | null
          product_id: string
          social_post_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          blog_id?: string | null
          created_at?: string | null
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          idea_id?: string | null
          notes?: string | null
          platforms?: string[] | null
          product_id?: string
          social_post_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "ai_blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "ai_social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          aeo_potential: number | null
          assigned_to: string | null
          content_pillar: string | null
          content_type: string
          created_at: string | null
          description: string | null
          gap_score: number | null
          id: string
          outline: Json | null
          overall_score: number | null
          priority: number | null
          product_id: string
          scheduled_for: string | null
          seo_potential: number | null
          source: string | null
          source_data: Json | null
          source_url: string | null
          status: string | null
          target_keywords: string[] | null
          title: string
          trend_score: number | null
          updated_at: string | null
          viral_potential: number | null
        }
        Insert: {
          aeo_potential?: number | null
          assigned_to?: string | null
          content_pillar?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          gap_score?: number | null
          id?: string
          outline?: Json | null
          overall_score?: number | null
          priority?: number | null
          product_id: string
          scheduled_for?: string | null
          seo_potential?: number | null
          source?: string | null
          source_data?: Json | null
          source_url?: string | null
          status?: string | null
          target_keywords?: string[] | null
          title: string
          trend_score?: number | null
          updated_at?: string | null
          viral_potential?: number | null
        }
        Update: {
          aeo_potential?: number | null
          assigned_to?: string | null
          content_pillar?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          gap_score?: number | null
          id?: string
          outline?: Json | null
          overall_score?: number | null
          priority?: number | null
          product_id?: string
          scheduled_for?: string | null
          seo_potential?: number | null
          source?: string | null
          source_data?: Json | null
          source_url?: string | null
          status?: string | null
          target_keywords?: string[] | null
          title?: string
          trend_score?: number | null
          updated_at?: string | null
          viral_potential?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      content_learnings: {
        Row: {
          after_value: number | null
          applied: boolean | null
          applied_at: string | null
          before_value: number | null
          confidence: number | null
          created_at: string | null
          evidence: Json | null
          id: string
          improvement_percent: number | null
          insight: string
          learning_type: string
          metric_name: string | null
          platform: string | null
          product_id: string
          sample_size: number | null
          statistical_significance: number | null
          strategy_change_description: string | null
          superseded_by: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          after_value?: number | null
          applied?: boolean | null
          applied_at?: string | null
          before_value?: number | null
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          improvement_percent?: number | null
          insight: string
          learning_type: string
          metric_name?: string | null
          platform?: string | null
          product_id: string
          sample_size?: number | null
          statistical_significance?: number | null
          strategy_change_description?: string | null
          superseded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          after_value?: number | null
          applied?: boolean | null
          applied_at?: string | null
          before_value?: number | null
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          improvement_percent?: number | null
          insight?: string
          learning_type?: string
          metric_name?: string | null
          platform?: string | null
          product_id?: string
          sample_size?: number | null
          statistical_significance?: number | null
          strategy_change_description?: string | null
          superseded_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_learnings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_learnings_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "content_learnings"
            referencedColumns: ["id"]
          },
        ]
      }
      content_patterns: {
        Row: {
          ai_notes: string | null
          avg_comments: number | null
          avg_engagement_rate: number | null
          avg_impressions: number | null
          avg_likes: number | null
          avg_shares: number | null
          best_post_id: string | null
          created_at: string | null
          id: string
          last_analyzed_at: string | null
          pattern_key: string
          pattern_type: string
          recommendation_score: number | null
          total_posts: number | null
          updated_at: string | null
          user_id: string
          worst_post_id: string | null
        }
        Insert: {
          ai_notes?: string | null
          avg_comments?: number | null
          avg_engagement_rate?: number | null
          avg_impressions?: number | null
          avg_likes?: number | null
          avg_shares?: number | null
          best_post_id?: string | null
          created_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          pattern_key: string
          pattern_type: string
          recommendation_score?: number | null
          total_posts?: number | null
          updated_at?: string | null
          user_id: string
          worst_post_id?: string | null
        }
        Update: {
          ai_notes?: string | null
          avg_comments?: number | null
          avg_engagement_rate?: number | null
          avg_impressions?: number | null
          avg_likes?: number | null
          avg_shares?: number | null
          best_post_id?: string | null
          created_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          pattern_key?: string
          pattern_type?: string
          recommendation_score?: number | null
          total_posts?: number | null
          updated_at?: string | null
          user_id?: string
          worst_post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_patterns_best_post_id_fkey"
            columns: ["best_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_patterns_worst_post_id_fkey"
            columns: ["worst_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          display_name: string
          id: string
          payment_provider: string | null
          plan_expires_at: string | null
          plan_id: string | null
          plan_status: string | null
          product_count: number | null
          razorpay_customer_id: string | null
          role: string | null
          stripe_customer_id: string | null
          total_storage_used_bytes: number | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          payment_provider?: string | null
          plan_expires_at?: string | null
          plan_id?: string | null
          plan_status?: string | null
          product_count?: number | null
          razorpay_customer_id?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          total_storage_used_bytes?: number | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          payment_provider?: string | null
          plan_expires_at?: string | null
          plan_id?: string | null
          plan_status?: string | null
          product_count?: number | null
          razorpay_customer_id?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          total_storage_used_bytes?: number | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "platform_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_documents: {
        Row: {
          document_id: string
          entity_id: string
          linked_at: string | null
        }
        Insert: {
          document_id: string
          entity_id: string
          linked_at?: string | null
        }
        Update: {
          document_id?: string
          entity_id?: string
          linked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "user_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      image_prompt_performance: {
        Row: {
          created_at: string | null
          id: string
          original_prompt: string
          product_id: string | null
          replacement_prompts: string[] | null
          times_kept: number | null
          times_replaced: number | null
          times_used: number | null
          topic_keywords: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_prompt: string
          product_id?: string | null
          replacement_prompts?: string[] | null
          times_kept?: number | null
          times_replaced?: number | null
          times_used?: number | null
          topic_keywords?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          original_prompt?: string
          product_id?: string | null
          replacement_prompts?: string[] | null
          times_kept?: number | null
          times_replaced?: number | null
          times_used?: number | null
          topic_keywords?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_prompt_performance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          contextual_summary: string | null
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          section_hierarchy: string[] | null
          structured_metadata: Json | null
        }
        Insert: {
          chunk_index: number
          content: string
          contextual_summary?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          section_hierarchy?: string[] | null
          structured_metadata?: Json | null
        }
        Update: {
          chunk_index?: number
          content?: string
          contextual_summary?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          section_hierarchy?: string[] | null
          structured_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          approved_by_name: string | null
          authority_level: number | null
          chunk_count: number | null
          contributed_by_product_user_id: string | null
          contributor_email: string | null
          contributor_name: string | null
          created_at: string | null
          created_by: string | null
          document_type: string | null
          id: string
          knowledge_base_id: string | null
          original_user_document_id: string | null
          source_label: string | null
          source_type: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_by_name?: string | null
          authority_level?: number | null
          chunk_count?: number | null
          contributed_by_product_user_id?: string | null
          contributor_email?: string | null
          contributor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          id?: string
          knowledge_base_id?: string | null
          original_user_document_id?: string | null
          source_label?: string | null
          source_type: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_by_name?: string | null
          authority_level?: number | null
          chunk_count?: number | null
          contributed_by_product_user_id?: string | null
          contributor_email?: string | null
          contributor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          id?: string
          knowledge_base_id?: string | null
          original_user_document_id?: string | null
          source_label?: string | null
          source_type?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_contributed_by_product_user_id_fkey"
            columns: ["contributed_by_product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "knowledge_documents_contributed_by_product_user_id_fkey"
            columns: ["contributed_by_product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "knowledge_documents_contributed_by_product_user_id_fkey"
            columns: ["contributed_by_product_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_documents_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_documents_original_user_document_id_fkey"
            columns: ["original_user_document_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_source_cache: {
        Row: {
          cache_key: string
          content_text: string | null
          embedding: string | null
          expires_at: string | null
          fetched_at: string | null
          hit_count: number | null
          id: string
          last_hit_at: string | null
          query_text: string | null
          response_data: Json
          source_id: string
        }
        Insert: {
          cache_key: string
          content_text?: string | null
          embedding?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          query_text?: string | null
          response_data: Json
          source_id: string
        }
        Update: {
          cache_key?: string
          content_text?: string | null
          embedding?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          query_text?: string | null
          response_data?: Json
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_source_cache_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_source_stats"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "knowledge_source_cache_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          cache_duration_hours: number | null
          config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          last_refreshed_at: string | null
          name: string
          priority: number | null
          product_id: string
          refresh_strategy: string | null
          source_type: string
          trust_level: number | null
          updated_at: string | null
        }
        Insert: {
          cache_duration_hours?: number | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          name: string
          priority?: number | null
          product_id: string
          refresh_strategy?: string | null
          source_type: string
          trust_level?: number | null
          updated_at?: string | null
        }
        Update: {
          cache_duration_hours?: number | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          name?: string
          priority?: number | null
          product_id?: string
          refresh_strategy?: string | null
          source_type?: string
          trust_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          created_document_id: string | null
          detected_category: string | null
          id: string
          occurrence_count: number | null
          priority_score: number | null
          product_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          sample_content: string | null
          similarity_to_kb: number | null
          source_document_id: string | null
          source_user_id: string | null
          status: string | null
          topic: string
          topic_embedding: string | null
          uniqueness_score: number | null
          updated_at: string | null
          user_ids: string[] | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          created_document_id?: string | null
          detected_category?: string | null
          id?: string
          occurrence_count?: number | null
          priority_score?: number | null
          product_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_content?: string | null
          similarity_to_kb?: number | null
          source_document_id?: string | null
          source_user_id?: string | null
          status?: string | null
          topic: string
          topic_embedding?: string | null
          uniqueness_score?: number | null
          updated_at?: string | null
          user_ids?: string[] | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          created_document_id?: string | null
          detected_category?: string | null
          id?: string
          occurrence_count?: number | null
          priority_score?: number | null
          product_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_content?: string | null
          similarity_to_kb?: number | null
          source_document_id?: string | null
          source_user_id?: string | null
          status?: string | null
          topic?: string
          topic_embedding?: string | null
          uniqueness_score?: number | null
          updated_at?: string | null
          user_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_suggestions_created_document_id_fkey"
            columns: ["created_document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_suggestions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_suggestions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "knowledge_suggestions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "knowledge_suggestions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_performance: {
        Row: {
          avg_rating: number | null
          edit_rate: number | null
          id: string
          last_used_at: string | null
          layout_type: string
          product_id: string | null
          times_used: number | null
          topic_category: string | null
        }
        Insert: {
          avg_rating?: number | null
          edit_rate?: number | null
          id?: string
          last_used_at?: string | null
          layout_type: string
          product_id?: string | null
          times_used?: number | null
          topic_category?: string | null
        }
        Update: {
          avg_rating?: number | null
          edit_rate?: number | null
          id?: string
          last_used_at?: string | null
          layout_type?: string
          product_id?: string | null
          times_used?: number | null
          topic_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "layout_performance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_citations: {
        Row: {
          citation_text: string | null
          citation_type: string | null
          confidence: number | null
          content_id: string | null
          content_type: string | null
          discovered_at: string | null
          discovered_by: string | null
          full_response: string | null
          id: string
          llm_model: string | null
          llm_name: string
          product_id: string
          query: string | null
          response_snippet: string | null
          screenshot_url: string | null
          sentiment: string | null
          source_url: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          citation_text?: string | null
          citation_type?: string | null
          confidence?: number | null
          content_id?: string | null
          content_type?: string | null
          discovered_at?: string | null
          discovered_by?: string | null
          full_response?: string | null
          id?: string
          llm_model?: string | null
          llm_name: string
          product_id: string
          query?: string | null
          response_snippet?: string | null
          screenshot_url?: string | null
          sentiment?: string | null
          source_url?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          citation_text?: string | null
          citation_type?: string | null
          confidence?: number | null
          content_id?: string | null
          content_type?: string | null
          discovered_at?: string | null
          discovered_by?: string | null
          full_response?: string | null
          id?: string
          llm_model?: string | null
          llm_name?: string
          product_id?: string
          query?: string | null
          response_snippet?: string | null
          screenshot_url?: string | null
          sentiment?: string | null
          source_url?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_citations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          description: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          last_run_status: string | null
          name: string
          next_run_at: string | null
          product_id: string
          run_count: number | null
          schedule_cron: string | null
          schedule_timezone: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_status?: string | null
          name: string
          next_run_at?: string | null
          product_id: string
          run_count?: number | null
          schedule_cron?: string | null
          schedule_timezone?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_status?: string | null
          name?: string
          next_run_at?: string | null
          product_id?: string
          run_count?: number | null
          schedule_cron?: string | null
          schedule_timezone?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_automation_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_daily_reports: {
        Row: {
          ai_insights: string[] | null
          anomalies: Json | null
          blog_unique_visitors: number | null
          blog_views: number | null
          content_suggestions: Json | null
          created_at: string | null
          id: string
          pattern_changes: Json | null
          platform_metrics: Json | null
          product_id: string
          report_date: string
          strategy_recommendations: string[] | null
          timing_adjustments: Json | null
          top_posts: Json | null
          total_clicks: number | null
          total_engagements: number | null
          total_impressions: number | null
          total_new_followers: number | null
          vs_last_month: Json | null
          vs_last_week: Json | null
          vs_yesterday: Json | null
          worst_posts: Json | null
        }
        Insert: {
          ai_insights?: string[] | null
          anomalies?: Json | null
          blog_unique_visitors?: number | null
          blog_views?: number | null
          content_suggestions?: Json | null
          created_at?: string | null
          id?: string
          pattern_changes?: Json | null
          platform_metrics?: Json | null
          product_id: string
          report_date: string
          strategy_recommendations?: string[] | null
          timing_adjustments?: Json | null
          top_posts?: Json | null
          total_clicks?: number | null
          total_engagements?: number | null
          total_impressions?: number | null
          total_new_followers?: number | null
          vs_last_month?: Json | null
          vs_last_week?: Json | null
          vs_yesterday?: Json | null
          worst_posts?: Json | null
        }
        Update: {
          ai_insights?: string[] | null
          anomalies?: Json | null
          blog_unique_visitors?: number | null
          blog_views?: number | null
          content_suggestions?: Json | null
          created_at?: string | null
          id?: string
          pattern_changes?: Json | null
          platform_metrics?: Json | null
          product_id?: string
          report_date?: string
          strategy_recommendations?: string[] | null
          timing_adjustments?: Json | null
          top_posts?: Json | null
          total_clicks?: number | null
          total_engagements?: number | null
          total_impressions?: number | null
          total_new_followers?: number | null
          vs_last_month?: Json | null
          vs_last_week?: Json | null
          vs_yesterday?: Json | null
          worst_posts?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_daily_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_facts: {
        Row: {
          confidence: number | null
          confidence_reason: string | null
          created_at: string | null
          extraction_context: string | null
          extraction_method: string | null
          fact_category: string
          fact_full_text: string | null
          fact_key: string | null
          fact_object: string
          fact_predicate: string | null
          fact_subcategory: string | null
          fact_subject: string | null
          id: string
          importance_score: number | null
          is_active: boolean | null
          is_temporal: boolean | null
          last_reinforced_at: string | null
          last_used_at: string | null
          product_user_id: string | null
          reinforcement_count: number | null
          source_message_id: string | null
          source_session_id: string | null
          superseded_by_id: string | null
          supersession_reason: string | null
          temporal_context: string | null
          updated_at: string | null
          usage_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          confidence?: number | null
          confidence_reason?: string | null
          created_at?: string | null
          extraction_context?: string | null
          extraction_method?: string | null
          fact_category: string
          fact_full_text?: string | null
          fact_key?: string | null
          fact_object: string
          fact_predicate?: string | null
          fact_subcategory?: string | null
          fact_subject?: string | null
          id?: string
          importance_score?: number | null
          is_active?: boolean | null
          is_temporal?: boolean | null
          last_reinforced_at?: string | null
          last_used_at?: string | null
          product_user_id?: string | null
          reinforcement_count?: number | null
          source_message_id?: string | null
          source_session_id?: string | null
          superseded_by_id?: string | null
          supersession_reason?: string | null
          temporal_context?: string | null
          updated_at?: string | null
          usage_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          confidence?: number | null
          confidence_reason?: string | null
          created_at?: string | null
          extraction_context?: string | null
          extraction_method?: string | null
          fact_category?: string
          fact_full_text?: string | null
          fact_key?: string | null
          fact_object?: string
          fact_predicate?: string | null
          fact_subcategory?: string | null
          fact_subject?: string | null
          id?: string
          importance_score?: number | null
          is_active?: boolean | null
          is_temporal?: boolean | null
          last_reinforced_at?: string | null
          last_used_at?: string | null
          product_user_id?: string | null
          reinforcement_count?: number | null
          source_message_id?: string | null
          source_session_id?: string | null
          superseded_by_id?: string | null
          supersession_reason?: string | null
          temporal_context?: string | null
          updated_at?: string | null
          usage_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_facts_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "memory_facts_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "memory_facts_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_facts_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_facts_source_session_id_fkey"
            columns: ["source_session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_facts_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "memory_facts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_plans: {
        Row: {
          created_at: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          kb_limit: number | null
          name: string
          price_annual: number | null
          price_monthly: number | null
          product_limit: number | null
          storage_limit_gb: number | null
          user_limit: number | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          kb_limit?: number | null
          name: string
          price_annual?: number | null
          price_monthly?: number | null
          product_limit?: number | null
          storage_limit_gb?: number | null
          user_limit?: number | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          kb_limit?: number | null
          name?: string
          price_annual?: number | null
          price_monthly?: number | null
          product_limit?: number | null
          storage_limit_gb?: number | null
          user_limit?: number | null
        }
        Relationships: []
      }
      presentation_edits: {
        Row: {
          after_value: Json | null
          before_value: Json | null
          created_at: string | null
          edit_reason: string | null
          edit_type: string
          id: string
          presentation_id: string
          slide_index: number | null
          user_id: string
        }
        Insert: {
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string | null
          edit_reason?: string | null
          edit_type: string
          id?: string
          presentation_id: string
          slide_index?: number | null
          user_id: string
        }
        Update: {
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string | null
          edit_reason?: string | null
          edit_type?: string
          id?: string
          presentation_id?: string
          slide_index?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_edits_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_templates: {
        Row: {
          avg_rating: number | null
          category: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          id: string
          is_system_template: boolean | null
          name: string
          product_id: string | null
          slide_count: number | null
          source_presentation_id: string | null
          structure: Json
          times_used: number | null
          total_ratings: number | null
          updated_at: string | null
        }
        Insert: {
          avg_rating?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          id?: string
          is_system_template?: boolean | null
          name: string
          product_id?: string | null
          slide_count?: number | null
          source_presentation_id?: string | null
          structure: Json
          times_used?: number | null
          total_ratings?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_rating?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          id?: string
          is_system_template?: boolean | null
          name?: string
          product_id?: string | null
          slide_count?: number | null
          source_presentation_id?: string | null
          structure?: Json
          times_used?: number | null
          total_ratings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          audience: string | null
          chat_session_id: string | null
          created_at: string | null
          design_tokens: Json | null
          downloaded_pdf: boolean | null
          downloaded_pptx: boolean | null
          exported_at: string | null
          goal: string | null
          id: string
          markdown_content: string | null
          product_id: string
          quality_score_accessibility: number | null
          quality_score_content: number | null
          quality_score_design: number | null
          quality_score_narrative: number | null
          quality_score_overall: number | null
          slide_count: number | null
          slide_json: Json
          status: string | null
          template_id: string | null
          title: string
          topic: string | null
          updated_at: string | null
          user_feedback: string | null
          user_id: string
          user_rating: number | null
          view_count: number | null
          view_duration_seconds: number | null
          viewed_at: string | null
          was_discarded: boolean | null
          was_edited: boolean | null
        }
        Insert: {
          audience?: string | null
          chat_session_id?: string | null
          created_at?: string | null
          design_tokens?: Json | null
          downloaded_pdf?: boolean | null
          downloaded_pptx?: boolean | null
          exported_at?: string | null
          goal?: string | null
          id?: string
          markdown_content?: string | null
          product_id: string
          quality_score_accessibility?: number | null
          quality_score_content?: number | null
          quality_score_design?: number | null
          quality_score_narrative?: number | null
          quality_score_overall?: number | null
          slide_count?: number | null
          slide_json: Json
          status?: string | null
          template_id?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id: string
          user_rating?: number | null
          view_count?: number | null
          view_duration_seconds?: number | null
          viewed_at?: string | null
          was_discarded?: boolean | null
          was_edited?: boolean | null
        }
        Update: {
          audience?: string | null
          chat_session_id?: string | null
          created_at?: string | null
          design_tokens?: Json | null
          downloaded_pdf?: boolean | null
          downloaded_pptx?: boolean | null
          exported_at?: string | null
          goal?: string | null
          id?: string
          markdown_content?: string | null
          product_id?: string
          quality_score_accessibility?: number | null
          quality_score_content?: number | null
          quality_score_design?: number | null
          quality_score_narrative?: number | null
          quality_score_overall?: number | null
          slide_count?: number | null
          slide_json?: Json
          status?: string | null
          template_id?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string
          user_rating?: number | null
          view_count?: number | null
          view_duration_seconds?: number | null
          viewed_at?: string | null
          was_discarded?: boolean | null
          was_edited?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "presentations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "presentation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      proactive_insights: {
        Row: {
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          insight_category: string | null
          insight_type: string
          is_active: boolean | null
          priority: string | null
          product_user_id: string | null
          related_entities: Json | null
          related_facts: Json | null
          related_sessions: Json | null
          related_topics: Json | null
          relevance_explanation: string | null
          should_show_at: string | null
          show_context: string | null
          shown_at: string | null
          title: string
          trigger_condition: Json | null
          trigger_type: string | null
          triggered_at: string | null
          was_acted_upon: boolean | null
          was_dismissed: boolean | null
          was_helpful: boolean | null
          was_shown: boolean | null
        }
        Insert: {
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          insight_category?: string | null
          insight_type: string
          is_active?: boolean | null
          priority?: string | null
          product_user_id?: string | null
          related_entities?: Json | null
          related_facts?: Json | null
          related_sessions?: Json | null
          related_topics?: Json | null
          relevance_explanation?: string | null
          should_show_at?: string | null
          show_context?: string | null
          shown_at?: string | null
          title: string
          trigger_condition?: Json | null
          trigger_type?: string | null
          triggered_at?: string | null
          was_acted_upon?: boolean | null
          was_dismissed?: boolean | null
          was_helpful?: boolean | null
          was_shown?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_category?: string | null
          insight_type?: string
          is_active?: boolean | null
          priority?: string | null
          product_user_id?: string | null
          related_entities?: Json | null
          related_facts?: Json | null
          related_sessions?: Json | null
          related_topics?: Json | null
          relevance_explanation?: string | null
          should_show_at?: string | null
          show_context?: string | null
          shown_at?: string | null
          title?: string
          trigger_condition?: Json | null
          trigger_type?: string | null
          triggered_at?: string | null
          was_acted_upon?: boolean | null
          was_dismissed?: boolean | null
          was_helpful?: boolean | null
          was_shown?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "proactive_insights_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "proactive_insights_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "proactive_insights_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_api_keys: {
        Row: {
          allowed_origins: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string | null
          permissions: string[] | null
          product_id: string
          rate_limit_per_minute: number | null
          request_count: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_origins?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string | null
          permissions?: string[] | null
          product_id: string
          rate_limit_per_minute?: number | null
          request_count?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_origins?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string | null
          permissions?: string[] | null
          product_id?: string
          rate_limit_per_minute?: number | null
          request_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_api_keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_design_tokens: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string | null
          font_body: string | null
          font_heading: string | null
          font_size_base: number | null
          id: string
          image_style: string | null
          learned_preferences: Json | null
          preferred_layouts: Json | null
          primary_color: string | null
          product_id: string
          secondary_color: string | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string | null
          font_body?: string | null
          font_heading?: string | null
          font_size_base?: number | null
          id?: string
          image_style?: string | null
          learned_preferences?: Json | null
          preferred_layouts?: Json | null
          primary_color?: string | null
          product_id: string
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string | null
          font_body?: string | null
          font_heading?: string | null
          font_size_base?: number | null
          id?: string
          image_style?: string | null
          learned_preferences?: Json | null
          preferred_layouts?: Json | null
          primary_color?: string | null
          product_id?: string
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_design_tokens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_entity_types: {
        Row: {
          created_at: string | null
          fields: Json | null
          icon: string | null
          id: string
          name: string
          name_plural: string | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          fields?: Json | null
          icon?: string | null
          id?: string
          name: string
          name_plural?: string | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          fields?: Json | null
          icon?: string | null
          id?: string
          name?: string
          name_plural?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_entity_types_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_knowledge_bases: {
        Row: {
          created_at: string | null
          knowledge_base_id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          knowledge_base_id: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          knowledge_base_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_knowledge_bases_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_knowledge_bases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_marketing_profiles: {
        Row: {
          ai_model_preference: string | null
          auto_publish_blogs: boolean | null
          auto_publish_social: boolean | null
          blog_frequency: string | null
          brand_voice: string | null
          competitors: Json | null
          content_generation_enabled: boolean | null
          content_pillars: string[] | null
          created_at: string | null
          id: string
          instagram_frequency: string | null
          language_style: string | null
          linkedin_frequency: string | null
          long_tail_keywords: string[] | null
          optimal_hours: Json | null
          pillar_weights: Json | null
          posting_timezone: string | null
          primary_keywords: string[] | null
          primary_persona: Json | null
          product_id: string
          require_human_approval: boolean | null
          secondary_keywords: string[] | null
          secondary_personas: Json | null
          tagline: string | null
          tone_keywords: string[] | null
          twitter_frequency: string | null
          unique_value_proposition: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model_preference?: string | null
          auto_publish_blogs?: boolean | null
          auto_publish_social?: boolean | null
          blog_frequency?: string | null
          brand_voice?: string | null
          competitors?: Json | null
          content_generation_enabled?: boolean | null
          content_pillars?: string[] | null
          created_at?: string | null
          id?: string
          instagram_frequency?: string | null
          language_style?: string | null
          linkedin_frequency?: string | null
          long_tail_keywords?: string[] | null
          optimal_hours?: Json | null
          pillar_weights?: Json | null
          posting_timezone?: string | null
          primary_keywords?: string[] | null
          primary_persona?: Json | null
          product_id: string
          require_human_approval?: boolean | null
          secondary_keywords?: string[] | null
          secondary_personas?: Json | null
          tagline?: string | null
          tone_keywords?: string[] | null
          twitter_frequency?: string | null
          unique_value_proposition?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model_preference?: string | null
          auto_publish_blogs?: boolean | null
          auto_publish_social?: boolean | null
          blog_frequency?: string | null
          brand_voice?: string | null
          competitors?: Json | null
          content_generation_enabled?: boolean | null
          content_pillars?: string[] | null
          created_at?: string | null
          id?: string
          instagram_frequency?: string | null
          language_style?: string | null
          linkedin_frequency?: string | null
          long_tail_keywords?: string[] | null
          optimal_hours?: Json | null
          pillar_weights?: Json | null
          posting_timezone?: string | null
          primary_keywords?: string[] | null
          primary_persona?: Json | null
          product_id?: string
          require_human_approval?: boolean | null
          secondary_keywords?: string[] | null
          secondary_personas?: Json | null
          tagline?: string | null
          tone_keywords?: string[] | null
          twitter_frequency?: string | null
          unique_value_proposition?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_marketing_profiles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          knowledge_sources: string[] | null
          name: string
          output_format: string | null
          product_id: string
          system_prompt: string | null
          trigger_keywords: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          knowledge_sources?: string[] | null
          name: string
          output_format?: string | null
          product_id: string
          system_prompt?: string | null
          trigger_keywords?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          knowledge_sources?: string[] | null
          name?: string
          output_format?: string | null
          product_id?: string
          system_prompt?: string | null
          trigger_keywords?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "product_tasks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_annual: number | null
          price_monthly: number | null
          product_id: string | null
          razorpay_plan_id_annual: string | null
          razorpay_plan_id_monthly: string | null
          slug: string
          stripe_price_id_annual: string | null
          stripe_price_id_monthly: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_annual?: number | null
          price_monthly?: number | null
          product_id?: string | null
          razorpay_plan_id_annual?: string | null
          razorpay_plan_id_monthly?: string | null
          slug: string
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_annual?: number | null
          price_monthly?: number | null
          product_id?: string | null
          razorpay_plan_id_annual?: string | null
          razorpay_plan_id_monthly?: string | null
          slug?: string
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_users: {
        Row: {
          avatar_url: string | null
          badges: Json | null
          contribution_streak: number | null
          contributor_rank: string | null
          contributor_score: number | null
          created_at: string | null
          display_name: string | null
          id: string
          last_active_at: string | null
          last_contribution_date: string | null
          product_id: string
          role: string | null
          storage_limit_bytes: number | null
          storage_used_bytes: number | null
          total_chunks_contributed: number | null
          total_docs_contributed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          badges?: Json | null
          contribution_streak?: number | null
          contributor_rank?: string | null
          contributor_score?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          last_active_at?: string | null
          last_contribution_date?: string | null
          product_id: string
          role?: string | null
          storage_limit_bytes?: number | null
          storage_used_bytes?: number | null
          total_chunks_contributed?: number | null
          total_docs_contributed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          badges?: Json | null
          contribution_streak?: number | null
          contributor_rank?: string | null
          contributor_score?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          last_active_at?: string | null
          last_contribution_date?: string | null
          product_id?: string
          role?: string | null
          storage_limit_bytes?: number | null
          storage_used_bytes?: number | null
          total_chunks_contributed?: number | null
          total_docs_contributed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_users_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_config: Json | null
          category: string | null
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          domain: string | null
          favicon_url: string | null
          id: string
          is_featured: boolean | null
          jurisdiction: string[] | null
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          status: string | null
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          ai_config?: Json | null
          category?: string | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          domain?: string | null
          favicon_url?: string | null
          id?: string
          is_featured?: boolean | null
          jurisdiction?: string[] | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          status?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_config?: Json | null
          category?: string | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          domain?: string | null
          favicon_url?: string | null
          id?: string
          is_featured?: boolean | null
          jurisdiction?: string[] | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          status?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_optimization_rules: {
        Row: {
          action: Json
          condition: Json
          confidence_score: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          product_id: string | null
          rule_type: string
          success_rate: number | null
          times_applied: number | null
          updated_at: string | null
        }
        Insert: {
          action: Json
          condition: Json
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          rule_type: string
          success_rate?: number | null
          times_applied?: number | null
          updated_at?: string | null
        }
        Update: {
          action?: Json
          condition?: Json
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          rule_type?: string
          success_rate?: number | null
          times_applied?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_optimization_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      semantic_cache: {
        Row: {
          complexity_level: string | null
          confidence: number | null
          created_at: string | null
          expires_at: string
          hit_count: number | null
          id: string
          last_hit_at: string | null
          product_id: string
          query_embedding: string | null
          query_normalized: string
          query_text: string
          reasoning_metadata: Json | null
          response: string
          sources: Json | null
          user_feedback: string | null
          user_id: string | null
        }
        Insert: {
          complexity_level?: string | null
          confidence?: number | null
          created_at?: string | null
          expires_at: string
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          product_id: string
          query_embedding?: string | null
          query_normalized: string
          query_text: string
          reasoning_metadata?: Json | null
          response: string
          sources?: Json | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Update: {
          complexity_level?: string | null
          confidence?: number | null
          created_at?: string | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          product_id?: string
          query_embedding?: string | null
          query_normalized?: string
          query_text?: string
          reasoning_metadata?: Json | null
          response?: string
          sources?: Json | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "semantic_cache_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          platform: string
          platform_avatar_url: string | null
          platform_display_name: string | null
          platform_user_id: string | null
          platform_username: string | null
          product_id: string | null
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          platform: string
          platform_avatar_url?: string | null
          platform_display_name?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          product_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          platform?: string
          platform_avatar_url?: string | null
          platform_display_name?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          product_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      social_analytics: {
        Row: {
          clicks: number | null
          comments: number | null
          created_at: string | null
          engagement_rate: number | null
          follower_change: number | null
          hours_since_publish: number | null
          id: string
          impressions: number | null
          likes: number | null
          post_id: string
          profile_visits: number | null
          raw_data: Json | null
          reach: number | null
          saves: number | null
          shares: number | null
          snapshot_at: string | null
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          follower_change?: number | null
          hours_since_publish?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id: string
          profile_visits?: number | null
          raw_data?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          snapshot_at?: string | null
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          follower_change?: number | null
          hours_since_publish?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id?: string
          profile_visits?: number | null
          raw_data?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          snapshot_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_insights: {
        Row: {
          content_worthiness_score: number | null
          created_at: string | null
          dismissed_reason: string | null
          id: string
          key_takeaways: string[] | null
          metadata: Json | null
          session_id: string | null
          status: string | null
          suggested_hooks: string[] | null
          suggested_platforms: string[] | null
          suggested_tone: string | null
          summary: string
          title: string
          topic_tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_worthiness_score?: number | null
          created_at?: string | null
          dismissed_reason?: string | null
          id?: string
          key_takeaways?: string[] | null
          metadata?: Json | null
          session_id?: string | null
          status?: string | null
          suggested_hooks?: string[] | null
          suggested_platforms?: string[] | null
          suggested_tone?: string | null
          summary: string
          title: string
          topic_tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_worthiness_score?: number | null
          created_at?: string | null
          dismissed_reason?: string | null
          id?: string
          key_takeaways?: string[] | null
          metadata?: Json | null
          session_id?: string | null
          status?: string | null
          suggested_hooks?: string[] | null
          suggested_platforms?: string[] | null
          suggested_tone?: string | null
          summary?: string
          title?: string
          topic_tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          ai_confidence_score: number | null
          ai_draft_variant: string | null
          content: string
          content_html: string | null
          created_at: string | null
          edit_count: number | null
          failed_reason: string | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          mentions: string[] | null
          metadata: Json | null
          platform: string
          platform_post_id: string | null
          platform_post_url: string | null
          published_at: string | null
          scheduled_at: string | null
          social_account_id: string | null
          source_insight_id: string | null
          source_session_id: string | null
          source_type: string | null
          status: string
          updated_at: string | null
          user_edited: boolean | null
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_draft_variant?: string | null
          content: string
          content_html?: string | null
          created_at?: string | null
          edit_count?: number | null
          failed_reason?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          mentions?: string[] | null
          metadata?: Json | null
          platform: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id?: string | null
          source_insight_id?: string | null
          source_session_id?: string | null
          source_type?: string | null
          status?: string
          updated_at?: string | null
          user_edited?: boolean | null
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_draft_variant?: string | null
          content?: string
          content_html?: string | null
          created_at?: string | null
          edit_count?: number | null
          failed_reason?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          mentions?: string[] | null
          metadata?: Json | null
          platform?: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id?: string | null
          source_insight_id?: string | null
          source_session_id?: string | null
          source_type?: string | null
          status?: string
          updated_at?: string | null
          user_edited?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          created_at: string | null
          current_period_end: string | null
          id: string
          payment_provider: string | null
          price_cents: number | null
          product_id: string | null
          razorpay_customer_id: string | null
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_period?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          payment_provider?: string | null
          price_cents?: number | null
          product_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_period?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          payment_provider?: string | null
          price_cents?: number | null
          product_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "product_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_web_sources: {
        Row: {
          authority_score: number | null
          crawl_frequency: string | null
          created_at: string | null
          created_by: string | null
          css_selectors: Json | null
          display_name: string | null
          domain: string
          exclude_patterns: string[] | null
          id: string
          is_active: boolean | null
          last_crawl_status: string | null
          last_crawled_at: string | null
          product_id: string
          rate_limit_ms: number | null
          respect_robots_txt: boolean | null
          source_type: string | null
          total_pages_crawled: number | null
          updated_at: string | null
          url_patterns: string[] | null
          use_javascript: boolean | null
        }
        Insert: {
          authority_score?: number | null
          crawl_frequency?: string | null
          created_at?: string | null
          created_by?: string | null
          css_selectors?: Json | null
          display_name?: string | null
          domain: string
          exclude_patterns?: string[] | null
          id?: string
          is_active?: boolean | null
          last_crawl_status?: string | null
          last_crawled_at?: string | null
          product_id: string
          rate_limit_ms?: number | null
          respect_robots_txt?: boolean | null
          source_type?: string | null
          total_pages_crawled?: number | null
          updated_at?: string | null
          url_patterns?: string[] | null
          use_javascript?: boolean | null
        }
        Update: {
          authority_score?: number | null
          crawl_frequency?: string | null
          created_at?: string | null
          created_by?: string | null
          css_selectors?: Json | null
          display_name?: string | null
          domain?: string
          exclude_patterns?: string[] | null
          id?: string
          is_active?: boolean | null
          last_crawl_status?: string | null
          last_crawled_at?: string | null
          product_id?: string
          rate_limit_ms?: number | null
          respect_robots_txt?: boolean | null
          source_type?: string | null
          total_pages_crawled?: number | null
          updated_at?: string | null
          url_patterns?: string[] | null
          use_javascript?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "trusted_web_sources_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cognitive_profile: {
        Row: {
          active_days: Json | null
          active_goals: Json | null
          active_hours: Json | null
          asks_followup_questions: boolean | null
          common_question_patterns: Json | null
          communication_style: string | null
          completed_goals: Json | null
          created_at: string | null
          current_projects: Json | null
          days_active: number | null
          default_sentiment: string | null
          domains: Json | null
          entities_discussed: Json | null
          expertise_evolution: Json | null
          expertise_levels: Json | null
          first_interaction_at: string | null
          frustration_triggers: Json | null
          handles_complexity: string | null
          id: string
          industry: string | null
          knowledge_gaps: Json | null
          last_interaction_at: string | null
          last_profile_update: string | null
          learning_velocity: Json | null
          organization_type: string | null
          patience_level: string | null
          peak_usage_time: string | null
          persona_keywords: Json | null
          persona_summary: string | null
          preferred_examples_type: string | null
          preferred_formatting: Json | null
          preferred_response_length: string | null
          prefers_step_by_step: boolean | null
          product_id: string | null
          product_user_id: string | null
          profession: string | null
          profile_changelog: Json | null
          profile_confidence: number | null
          profile_version: number | null
          query_complexity_avg: number | null
          recurring_challenges: Json | null
          satisfaction_signals: Json | null
          topics_explored: Json | null
          total_messages: number | null
          total_queries: number | null
          total_sessions: number | null
          typical_session_duration: number | null
          typical_session_length: number | null
          updated_at: string | null
          vocabulary_level: string | null
        }
        Insert: {
          active_days?: Json | null
          active_goals?: Json | null
          active_hours?: Json | null
          asks_followup_questions?: boolean | null
          common_question_patterns?: Json | null
          communication_style?: string | null
          completed_goals?: Json | null
          created_at?: string | null
          current_projects?: Json | null
          days_active?: number | null
          default_sentiment?: string | null
          domains?: Json | null
          entities_discussed?: Json | null
          expertise_evolution?: Json | null
          expertise_levels?: Json | null
          first_interaction_at?: string | null
          frustration_triggers?: Json | null
          handles_complexity?: string | null
          id?: string
          industry?: string | null
          knowledge_gaps?: Json | null
          last_interaction_at?: string | null
          last_profile_update?: string | null
          learning_velocity?: Json | null
          organization_type?: string | null
          patience_level?: string | null
          peak_usage_time?: string | null
          persona_keywords?: Json | null
          persona_summary?: string | null
          preferred_examples_type?: string | null
          preferred_formatting?: Json | null
          preferred_response_length?: string | null
          prefers_step_by_step?: boolean | null
          product_id?: string | null
          product_user_id?: string | null
          profession?: string | null
          profile_changelog?: Json | null
          profile_confidence?: number | null
          profile_version?: number | null
          query_complexity_avg?: number | null
          recurring_challenges?: Json | null
          satisfaction_signals?: Json | null
          topics_explored?: Json | null
          total_messages?: number | null
          total_queries?: number | null
          total_sessions?: number | null
          typical_session_duration?: number | null
          typical_session_length?: number | null
          updated_at?: string | null
          vocabulary_level?: string | null
        }
        Update: {
          active_days?: Json | null
          active_goals?: Json | null
          active_hours?: Json | null
          asks_followup_questions?: boolean | null
          common_question_patterns?: Json | null
          communication_style?: string | null
          completed_goals?: Json | null
          created_at?: string | null
          current_projects?: Json | null
          days_active?: number | null
          default_sentiment?: string | null
          domains?: Json | null
          entities_discussed?: Json | null
          expertise_evolution?: Json | null
          expertise_levels?: Json | null
          first_interaction_at?: string | null
          frustration_triggers?: Json | null
          handles_complexity?: string | null
          id?: string
          industry?: string | null
          knowledge_gaps?: Json | null
          last_interaction_at?: string | null
          last_profile_update?: string | null
          learning_velocity?: Json | null
          organization_type?: string | null
          patience_level?: string | null
          peak_usage_time?: string | null
          persona_keywords?: Json | null
          persona_summary?: string | null
          preferred_examples_type?: string | null
          preferred_formatting?: Json | null
          preferred_response_length?: string | null
          prefers_step_by_step?: boolean | null
          product_id?: string | null
          product_user_id?: string | null
          profession?: string | null
          profile_changelog?: Json | null
          profile_confidence?: number | null
          profile_version?: number | null
          query_complexity_avg?: number | null
          recurring_challenges?: Json | null
          satisfaction_signals?: Json | null
          topics_explored?: Json | null
          total_messages?: number | null
          total_queries?: number | null
          total_sessions?: number | null
          typical_session_duration?: number | null
          typical_session_length?: number | null
          updated_at?: string | null
          vocabulary_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_cognitive_profile_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cognitive_profile_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: true
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_cognitive_profile_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: true
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_cognitive_profile_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: true
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_document_chunks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          error_message: string | null
          file_path: string
          file_size_bytes: number | null
          file_type: string | null
          filename: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          product_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          user_knowledge_base_id: string | null
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          error_message?: string | null
          file_path: string
          file_size_bytes?: number | null
          file_type?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          product_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          user_knowledge_base_id?: string | null
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          error_message?: string | null
          file_path?: string
          file_size_bytes?: number | null
          file_type?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          product_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          user_knowledge_base_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_documents_user_knowledge_base_id_fkey"
            columns: ["user_knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "user_knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entities: {
        Row: {
          created_at: string | null
          entity_type_id: string
          id: string
          metadata: Json | null
          name: string
          notes: string | null
          product_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_type_id: string
          id?: string
          metadata?: Json | null
          name: string
          notes?: string | null
          product_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_type_id?: string
          id?: string
          metadata?: Json | null
          name?: string
          notes?: string | null
          product_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_entities_entity_type_id_fkey"
            columns: ["entity_type_id"]
            isOneToOne: false
            referencedRelation: "product_entity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entities_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_entities_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_entities_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entity_graph: {
        Row: {
          associated_topics: Json | null
          connected_entities: Json | null
          context_history: Json | null
          created_at: string | null
          description: string | null
          entity_name: string
          entity_name_normalized: string | null
          entity_subtype: string | null
          entity_type: string
          first_mentioned_at: string | null
          id: string
          is_active: boolean | null
          key_facts: Json | null
          last_mentioned_at: string | null
          mention_count: number | null
          mentions_by_session: Json | null
          merged_into_id: string | null
          product_user_id: string | null
          relationship_sentiment: string | null
          relationship_strength: number | null
          relationship_to_user: string | null
          updated_at: string | null
        }
        Insert: {
          associated_topics?: Json | null
          connected_entities?: Json | null
          context_history?: Json | null
          created_at?: string | null
          description?: string | null
          entity_name: string
          entity_name_normalized?: string | null
          entity_subtype?: string | null
          entity_type: string
          first_mentioned_at?: string | null
          id?: string
          is_active?: boolean | null
          key_facts?: Json | null
          last_mentioned_at?: string | null
          mention_count?: number | null
          mentions_by_session?: Json | null
          merged_into_id?: string | null
          product_user_id?: string | null
          relationship_sentiment?: string | null
          relationship_strength?: number | null
          relationship_to_user?: string | null
          updated_at?: string | null
        }
        Update: {
          associated_topics?: Json | null
          connected_entities?: Json | null
          context_history?: Json | null
          created_at?: string | null
          description?: string | null
          entity_name?: string
          entity_name_normalized?: string | null
          entity_subtype?: string | null
          entity_type?: string
          first_mentioned_at?: string | null
          id?: string
          is_active?: boolean | null
          key_facts?: Json | null
          last_mentioned_at?: string | null
          mention_count?: number | null
          mentions_by_session?: Json | null
          merged_into_id?: string | null
          product_user_id?: string | null
          relationship_sentiment?: string | null
          relationship_strength?: number | null
          relationship_to_user?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_entity_graph_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "user_entity_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entity_graph_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_entity_graph_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_entity_graph_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_knowledge_bases: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          description: string | null
          document_count: number | null
          id: string
          name: string
          product_user_id: string
          updated_at: string | null
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          id?: string
          name: string
          product_user_id: string
          updated_at?: string | null
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          id?: string
          name?: string
          product_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_knowledge_bases_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_knowledge_bases_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_knowledge_bases_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_knowledge_chunks: {
        Row: {
          chunk_index: number | null
          content: string
          contextual_summary: string | null
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          product_user_id: string | null
          structured_metadata: Json | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          contextual_summary?: string | null
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          product_user_id?: string | null
          structured_metadata?: Json | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          contextual_summary?: string | null
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          product_user_id?: string | null
          structured_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_knowledge_chunks_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_knowledge_chunks_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_knowledge_chunks_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_style_samples: {
        Row: {
          content: string
          created_at: string | null
          id: string
          product_user_id: string
          task_id: string | null
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          product_user_id: string
          task_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          product_user_id?: string
          task_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_style_samples_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributor_stats"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_style_samples_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "knowledge_leaderboard"
            referencedColumns: ["product_user_id"]
          },
          {
            foreignKeyName: "user_style_samples_product_user_id_fkey"
            columns: ["product_user_id"]
            isOneToOne: false
            referencedRelation: "product_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_style_samples_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "product_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      web_knowledge_cache: {
        Row: {
          canonical_url: string | null
          content_hash: string | null
          crawled_at: string | null
          created_at: string | null
          expires_at: string
          extracted_date: string | null
          extracted_entities: Json | null
          id: string
          is_expired: boolean | null
          last_used_at: string | null
          page_type: string | null
          product_id: string
          raw_content: string | null
          source_id: string
          times_used: number | null
          title: string | null
          url: string
        }
        Insert: {
          canonical_url?: string | null
          content_hash?: string | null
          crawled_at?: string | null
          created_at?: string | null
          expires_at: string
          extracted_date?: string | null
          extracted_entities?: Json | null
          id?: string
          is_expired?: boolean | null
          last_used_at?: string | null
          page_type?: string | null
          product_id: string
          raw_content?: string | null
          source_id: string
          times_used?: number | null
          title?: string | null
          url: string
        }
        Update: {
          canonical_url?: string | null
          content_hash?: string | null
          crawled_at?: string | null
          created_at?: string | null
          expires_at?: string
          extracted_date?: string | null
          extracted_entities?: Json | null
          id?: string
          is_expired?: boolean | null
          last_used_at?: string | null
          page_type?: string | null
          product_id?: string
          raw_content?: string | null
          source_id?: string
          times_used?: number | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_knowledge_cache_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_knowledge_cache_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "trusted_web_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      web_knowledge_chunks: {
        Row: {
          authority_score: number
          cache_id: string
          chunk_index: number
          content: string
          contextual_summary: string | null
          created_at: string | null
          embedding: string | null
          expires_at: string
          id: string
          product_id: string
          source_display_name: string | null
          source_domain: string
          source_title: string | null
          source_url: string
          structured_metadata: Json | null
        }
        Insert: {
          authority_score: number
          cache_id: string
          chunk_index: number
          content: string
          contextual_summary?: string | null
          created_at?: string | null
          embedding?: string | null
          expires_at: string
          id?: string
          product_id: string
          source_display_name?: string | null
          source_domain: string
          source_title?: string | null
          source_url: string
          structured_metadata?: Json | null
        }
        Update: {
          authority_score?: number
          cache_id?: string
          chunk_index?: number
          content?: string
          contextual_summary?: string | null
          created_at?: string | null
          embedding?: string | null
          expires_at?: string
          id?: string
          product_id?: string
          source_display_name?: string | null
          source_domain?: string
          source_title?: string | null
          source_url?: string
          structured_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "web_knowledge_chunks_cache_id_fkey"
            columns: ["cache_id"]
            isOneToOne: false
            referencedRelation: "web_knowledge_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_knowledge_chunks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_sessions: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          last_message_at: string | null
          message_count: number | null
          messages: Json | null
          origin_url: string | null
          product_id: string
          user_agent: string | null
          visitor_email: string | null
          visitor_id: string | null
          visitor_name: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_message_at?: string | null
          message_count?: number | null
          messages?: Json | null
          origin_url?: string | null
          product_id: string
          user_agent?: string | null
          visitor_email?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_message_at?: string | null
          message_count?: number | null
          messages?: Json | null
          origin_url?: string | null
          product_id?: string
          user_agent?: string | null
          visitor_email?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_sessions_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "product_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_sessions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      knowledge_contributor_stats: {
        Row: {
          contributor_email: string | null
          contributor_name: string | null
          documents_contributed: number | null
          first_contribution: string | null
          last_contribution: string | null
          product_id: string | null
          product_name: string | null
          product_user_id: string | null
          total_chunks_contributed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_users_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_gap_summary: {
        Row: {
          approved_count: number | null
          avg_uniqueness: number | null
          max_priority: number | null
          pending_count: number | null
          product_id: string | null
          rejected_count: number | null
          total_user_uploads: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_leaderboard: {
        Row: {
          contribution_streak: number | null
          contributor_rank: string | null
          contributor_score: number | null
          display_name: string | null
          product_id: string | null
          product_name: string | null
          product_rank: number | null
          product_user_id: string | null
          total_chunks_contributed: number | null
          total_docs_contributed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_users_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_source_stats: {
        Row: {
          cached_entries: number | null
          is_active: boolean | null
          last_fetch: string | null
          last_used: string | null
          name: string | null
          product_id: string | null
          source_id: string | null
          source_type: string | null
          total_hits: number | null
          trust_level: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_knowledge_suggestion: {
        Args: {
          p_admin_id: string
          p_admin_notes?: string
          p_knowledge_base_ids: string[]
          p_suggestion_id: string
        }
        Returns: Json
      }
      approve_to_knowledge_bases_v2: {
        Args: {
          p_admin_id: string
          p_knowledge_base_ids: string[]
          p_suggestion_id: string
        }
        Returns: Json
      }
      award_contributor_points: {
        Args: {
          p_chunk_count: number
          p_product_user_id: string
          p_uniqueness_score?: number
        }
        Returns: Json
      }
      detect_entity_from_message: {
        Args: { p_message: string; p_product_user_id: string }
        Returns: string
      }
      detect_knowledge_gap: {
        Args: {
          p_content_embedding: string
          p_content_sample: string
          p_document_title: string
          p_product_id: string
          p_source_document_id: string
          p_source_user_id: string
        }
        Returns: Json
      }
      detect_task_from_message: {
        Args: { p_message: string; p_product_id: string }
        Returns: string
      }
      get_active_predictions: {
        Args: { p_user_id: string }
        Returns: {
          confidence: number
          created_at: string
          entity_name: string
          id: string
          prediction_type: string
          prediction_value: Json
          reasoning: string
          target_entity_name: string
        }[]
      }
      get_best_layouts_for_topic: {
        Args: {
          p_limit?: number
          p_product_id: string
          p_topic_category: string
        }
        Returns: {
          layout_type: string
          score: number
        }[]
      }
      get_entity_network: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          entity_id: string
          entity_name: string
          entity_type: string
          importance_score: number
          mention_count: number
          relationships: Json
        }[]
      }
      get_knowledge_suggestions: {
        Args: { p_limit?: number; p_product_id: string; p_status?: string }
        Returns: {
          created_at: string
          detected_category: string
          id: string
          occurrence_count: number
          priority_score: number
          sample_content: string
          similarity_to_kb: number
          source_document_id: string
          source_user_name: string
          status: string
          topic: string
          uniqueness_score: number
          user_count: number
        }[]
      }
      get_or_create_design_tokens: {
        Args: { p_product_id: string }
        Returns: Json
      }
      hybrid_search: {
        Args: {
          match_count?: number
          p_product_id: string
          p_user_id?: string
          query_embedding: string
          query_text: string
        }
        Returns: {
          authority_level: number
          chunk_id: string
          content: string
          document_title: string
          score: number
          source_tier: string
        }[]
      }
      increment_chunk_count: {
        Args: { count: number; kb_id: string }
        Returns: number
      }
      increment_document_count: { Args: { kb_id: string }; Returns: number }
      is_super_admin: { Args: never; Returns: boolean }
      match_entities: {
        Args: {
          match_count?: number
          p_user_id?: string
          query_embedding: string
        }
        Returns: {
          description: string
          entity_name: string
          entity_subtype: string
          entity_type: string
          id: string
          importance_score: number
          similarity: number
        }[]
      }
      match_user_knowledge_chunks: {
        Args: {
          match_count?: number
          p_product_user_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          document_name: string
          id: string
          similarity: number
        }[]
      }
      okse_cache_lookup: {
        Args: {
          p_product_id: string
          p_query_embedding: string
          p_similarity_threshold?: number
          p_user_id?: string
        }
        Returns: {
          cache_id: string
          confidence: number
          query_text: string
          response: string
          similarity: number
          sources: Json
        }[]
      }
      okse_fused_search: {
        Args: {
          p_kb_weight?: number
          p_knowledge_base_id: string
          p_match_count?: number
          p_product_id: string
          p_query_embedding: string
          p_query_text: string
          p_web_weight?: number
        }
        Returns: {
          authority_score: number
          chunk_id: string
          content: string
          contextual_summary: string
          rrf_score: number
          source_domain: string
          source_title: string
          source_type: string
          source_url: string
        }[]
      }
      okse_web_search: {
        Args: {
          p_match_count?: number
          p_min_authority?: number
          p_product_id: string
          p_query_embedding: string
        }
        Returns: {
          authority_score: number
          chunk_id: string
          content: string
          contextual_summary: string
          similarity: number
          source_display_name: string
          source_domain: string
          source_title: string
          source_url: string
        }[]
      }
      omniforge_hybrid_search: {
        Args: {
          p_match_count?: number
          p_product_id: string
          p_query_embedding: string
          p_query_text: string
          p_user_id?: string
        }
        Returns: {
          authority_level: number
          bm25_score: number
          chunk_id: string
          combined_score: number
          content: string
          contextual_summary: string
          document_title: string
          source_tier: string
          vector_score: number
        }[]
      }
      omniforge_user_hybrid_search: {
        Args: {
          p_match_count?: number
          p_product_user_id: string
          p_query_embedding: string
          p_query_text: string
        }
        Returns: {
          bm25_score: number
          chunk_id: string
          combined_score: number
          content: string
          contextual_summary: string
          document_title: string
          vector_score: number
        }[]
      }
      promote_to_template: {
        Args: { p_presentation_id: string }
        Returns: string
      }
      record_cache_hit: { Args: { p_cache_id: string }; Returns: undefined }
      reject_knowledge_suggestion: {
        Args: { p_admin_id: string; p_reason?: string; p_suggestion_id: string }
        Returns: Json
      }
      search_external_sources: {
        Args: {
          p_limit?: number
          p_product_id: string
          p_query_embedding: string
          p_query_text: string
        }
        Returns: {
          cache_id: string
          content: string
          response_data: Json
          similarity: number
          source_icon: string
          source_id: string
          source_name: string
          source_type: string
          trust_level: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_layout_performance: {
        Args: {
          p_layout_type: string
          p_product_id: string
          p_rating?: number
          p_topic_category: string
          p_was_edited?: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
