import React from "react";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

export const Button = ({
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    className = "",
    disabled,
    ...props
}: ButtonProps) => {
    const rootClassName = [
        styles.btn,
        styles[variant],
        styles[size],
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button
            className={rootClassName}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? <span className={styles.loader}></span> : children}
        </button>
    );
};
