'use client';

import { motion } from 'framer-motion';
import DictionaryTooltip from './DictionaryTooltip';

export default function ArticleContentWrapper({ children, articleId }: { children: React.ReactNode, articleId?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      <DictionaryTooltip articleId={articleId} />
      {children}
    </motion.div>
  );
}
