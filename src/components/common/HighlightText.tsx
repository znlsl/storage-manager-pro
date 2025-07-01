import React from 'react';

export interface HighlightTextProps {
  text: string;
  searchTerm: string;
  caseSensitive?: boolean;
  className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  searchTerm,
  caseSensitive = false,
  className = '',
}) => {
  if (!searchTerm || !text) {
    return <span className={className}>{text}</span>;
  }

  // 转义正则表达式特殊字符
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const escapedSearchTerm = escapeRegExp(searchTerm);
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${escapedSearchTerm})`, flags);

  // 分割文本并高亮匹配部分
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = caseSensitive
          ? part === searchTerm
          : part.toLowerCase() === searchTerm.toLowerCase();

        return isMatch ? (
          <mark key={index} className="search-highlight">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

// 高亮工具函数
export const highlightText = (
  text: string,
  searchTerm: string,
  caseSensitive: boolean = false,
): string => {
  if (!searchTerm || !text) {
    return text;
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const escapedSearchTerm = escapeRegExp(searchTerm);
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${escapedSearchTerm})`, flags);

  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

// 检查文本是否包含搜索词
export const containsSearchTerm = (
  text: string,
  searchTerm: string,
  caseSensitive: boolean = false,
): boolean => {
  if (!searchTerm || !text) {
    return false;
  }

  if (caseSensitive) {
    return text.includes(searchTerm);
  } else {
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  }
};

// 获取匹配的位置信息
export const getMatchPositions = (
  text: string,
  searchTerm: string,
  caseSensitive: boolean = false,
): Array<{ start: number; end: number; match: string }> => {
  if (!searchTerm || !text) {
    return [];
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const escapedSearchTerm = escapeRegExp(searchTerm);
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(escapedSearchTerm, flags);

  const matches: Array<{ start: number; end: number; match: string }> = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      match: match[0],
    });
  }

  return matches;
};
