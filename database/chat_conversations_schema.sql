-- Chat Conversations Table for Chatbot
-- Stores conversation history and lead qualification data

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id text PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  visitor_name text,
  visitor_email text,
  visitor_company text,
  project_type text,
  messages jsonb DEFAULT '[]'::jsonb NOT NULL,
  lead_qualified boolean DEFAULT false,
  route_suggested text, -- 'contact', 'projects', 'article', null
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_message_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_session ON public.chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_qualified ON public.chat_conversations(lead_qualified);
CREATE INDEX IF NOT EXISTS idx_chat_updated ON public.chat_conversations(last_message_at);

-- Comment
COMMENT ON TABLE public.chat_conversations IS 'Stores chatbot conversation history and lead qualification data';
