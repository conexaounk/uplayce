import { motion } from "framer-motion";
import { Link } from "wouter";
import { type Profile } from "@shared/schema";
import { Music, Instagram } from "lucide-react";

interface DJCardProps {
  dj: Profile & { user: { username: string } };
}

export function DJCard({ dj }: DJCardProps) {
  return (
    <Link href={`/djs/${dj.userId}`}>
    </Link>
  );
}
