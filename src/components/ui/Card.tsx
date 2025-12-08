import React from "react";
import styles from "./Card.module.css";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass";
    padding?: "none" | "sm" | "md" | "lg";
}

export const Card = ({
    children,
    variant = "default",
    padding = "md",
    className = "",
    ...props
}: CardProps) => {
    const rootClassName = [
        styles.card,
        styles[variant],
        styles[`p-${padding}`],
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={rootClassName} {...props}>
            {children}
        </div>
    );
};
