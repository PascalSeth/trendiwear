import React from 'react';

interface SEOProps {
  schema: Record<string, unknown>;
}

export const JsonLd: React.FC<SEOProps> = ({ schema }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
