interface FullLogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  responsive?: boolean;
}

export const FullLogo: React.FC<FullLogoProps> = ({
  className = "",
  iconSize,
  textSize = "text-lg",
  responsive = true,
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="OktaMan Logo"
        className={
          iconSize
            ? "object-contain"
            : "object-contain h-8 w-8"
        }
        style={iconSize ? { height: `${iconSize}px`, width: `${iconSize}px` } : undefined}
      />
      <span className={`font-semibold leading-none mt-[-5px] ${textSize} transition-opacity duration-200 ${responsive ? "group-data-[collapsible=icon]:opacity-0" : ""}`}>OktaMan</span>
    </div>
  );
};
