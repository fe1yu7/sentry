import React from 'react';
import {IconProps} from '../types/iconProps';
import theme from '../utils/theme';

export const IconMenu: React.FC<IconProps> = ({
  color: providedColor = 'currentColor',
  size: providedSize = 'sm',
  ...other
}: IconProps) => {
  const color = providedColor;
  const size =
    typeof providedSize === 'string' ? theme.iconSizes[providedSize] : providedSize;

  return (
    <svg viewBox="0 0 16 16" fill={color} height={size} width={size} {...other}>
      <path d="M15.19,2.53H.81A.75.75,0,0,1,.81,1H15.19a.75.75,0,1,1,0,1.5Z" />
      <path d="M15.19,15H.81a.75.75,0,0,1,0-1.5H15.19a.75.75,0,1,1,0,1.5Z" />
      <path d="M15.19,8.75H.81a.75.75,0,1,1,0-1.5H15.19a.75.75,0,0,1,0,1.5Z" />
    </svg>
  );
};
