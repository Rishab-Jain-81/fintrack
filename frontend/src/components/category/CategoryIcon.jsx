import { Tag } from "lucide-react";
import { categoryIconMap } from "../../utility/category/categoryIconCatalog";

export const CategoryIcon = ({ name, size = 18, className = "", ...props }) => {
  const IconComponent = (name && categoryIconMap[name]) || Tag;

  return <IconComponent size={size} className={className} {...props} />;
};
