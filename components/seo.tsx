import React from 'react';

interface SEOProps {
  schema: any;
}

export const JsonLd: React.FC<SEOProps> = ({ schema }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
