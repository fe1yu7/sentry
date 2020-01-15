export interface IconProps extends React.SVGAttributes<SVGElement> {
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'up' | 'right' | 'down' | 'left';
  fill?: string;
  circle?: string;
  type?: 'bar' | 'circle' | 'line';
}
