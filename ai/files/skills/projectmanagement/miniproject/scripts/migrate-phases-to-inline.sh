#!/bin/bash
#
# migrate-phases-to-inline.sh
# 
# Migrates phase-*.md files to inline sections in their parent epic files.
# Also removes phase_id from story frontmatter.
#
# Usage:
#   ./migrate-phases-to-inline.sh [--dry-run] [MEMORY_DIR]
#
# Options:
#   --dry-run   Show what would be changed without making changes
#
# Arguments:
#   MEMORY_DIR  Path to .memory directory (defaults to ./.memory)
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DRY_RUN=false
MEMORY_DIR=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            MEMORY_DIR="$1"
            shift
            ;;
    esac
done

# Default memory directory
if [[ -z "$MEMORY_DIR" ]]; then
    MEMORY_DIR="./.memory"
fi

# Resolve to absolute path
MEMORY_DIR=$(cd "$MEMORY_DIR" 2>/dev/null && pwd) || {
    echo -e "${RED}Error: Memory directory not found: $MEMORY_DIR${NC}"
    exit 1
}

echo -e "${BLUE}=== Phase Migration Tool ===${NC}"
echo -e "Memory directory: ${YELLOW}$MEMORY_DIR${NC}"
echo -e "Mode: ${YELLOW}$(if $DRY_RUN; then echo "DRY RUN"; else echo "LIVE"; fi)${NC}"
echo ""

# Track changes
PHASES_FOUND=0
PHASES_MIGRATED=0
STORIES_UPDATED=0
EPICS_UPDATED=0
ERRORS=0

# Function to extract frontmatter value
get_frontmatter_value() {
    local file="$1"
    local key="$2"
    grep -m1 "^${key}:" "$file" 2>/dev/null | sed "s/^${key}:[[:space:]]*//" || echo ""
}

# Function to remove phase_id from story frontmatter
remove_phase_id_from_story() {
    local story_file="$1"
    
    if grep -q "^phase_id:" "$story_file"; then
        echo -e "  ${YELLOW}→ Removing phase_id from:${NC} $(basename "$story_file")"
        
        if ! $DRY_RUN; then
            # Create temp file without phase_id line
            local temp_file=$(mktemp)
            sed '/^phase_id:/d' "$story_file" > "$temp_file"
            mv "$temp_file" "$story_file"
        fi
        
        ((STORIES_UPDATED++))
        return 0
    fi
    return 1
}

# Function to generate inline phase section from phase file
generate_inline_phase() {
    local phase_file="$1"
    
    local title=$(get_frontmatter_value "$phase_file" "title")
    local status=$(get_frontmatter_value "$phase_file" "status")
    local start_criteria=$(get_frontmatter_value "$phase_file" "start_criteria")
    local end_criteria=$(get_frontmatter_value "$phase_file" "end_criteria")
    
    # Extract phase number or name from title/filename
    local phase_name="$title"
    if [[ -z "$phase_name" ]]; then
        phase_name=$(basename "$phase_file" .md | sed 's/phase-[a-f0-9]*-//')
    fi
    
    # Find sections from the phase file body
    local overview=""
    local tasks=""
    local deliverables=""
    
    # Extract content after frontmatter
    local in_body=false
    local current_section=""
    
    while IFS= read -r line; do
        if [[ "$line" == "---" ]]; then
            if $in_body; then
                break  # End of frontmatter, but we already passed it
            fi
            in_body=true
            continue
        fi
        
        if $in_body; then
            if [[ "$line" =~ ^##[[:space:]]+(.*) ]]; then
                current_section="${BASH_REMATCH[1]}"
            elif [[ -n "$current_section" ]]; then
                case "$current_section" in
                    "Overview"|"overview")
                        overview+="$line"$'\n'
                        ;;
                    "Tasks"|"tasks")
                        tasks+="$line"$'\n'
                        ;;
                    "Deliverables"|"deliverables")
                        deliverables+="$line"$'\n'
                        ;;
                esac
            fi
        fi
    done < "$phase_file"
    
    # Generate inline section
    echo "### $phase_name"
    echo "- **Status**: ${status:-planned}"
    [[ -n "$start_criteria" ]] && echo "- **Start Criteria**: $start_criteria"
    [[ -n "$end_criteria" ]] && echo "- **End Criteria**: $end_criteria"
    
    if [[ -n "$tasks" ]]; then
        echo "- **Tasks**:"
        echo "$tasks" | sed 's/^/  /'
    else
        echo "- **Tasks**: (none migrated)"
    fi
    
    if [[ -n "$deliverables" ]]; then
        echo "- **Deliverables**:"
        echo "$deliverables" | sed 's/^/  /'
    fi
    
    echo ""
}

# Function to append phase to epic file
append_phase_to_epic() {
    local epic_file="$1"
    local phase_content="$2"
    
    if ! $DRY_RUN; then
        # Check if ## Phases section exists
        if grep -q "^## Phases" "$epic_file"; then
            # Append after ## Phases section
            # Find the line number of ## Phases and append after it
            local phases_line=$(grep -n "^## Phases" "$epic_file" | cut -d: -f1)
            
            # Create temp file with inserted content
            local temp_file=$(mktemp)
            head -n "$phases_line" "$epic_file" > "$temp_file"
            echo "" >> "$temp_file"
            echo "$phase_content" >> "$temp_file"
            tail -n +$((phases_line + 1)) "$epic_file" >> "$temp_file"
            mv "$temp_file" "$epic_file"
        else
            # Add ## Phases section at end of file
            echo "" >> "$epic_file"
            echo "## Phases" >> "$epic_file"
            echo "" >> "$epic_file"
            echo "$phase_content" >> "$epic_file"
        fi
    fi
}

# Find all phase files
echo -e "${BLUE}Scanning for phase files...${NC}"
phase_files=$(find "$MEMORY_DIR" -maxdepth 1 -name "phase-*.md" -type f 2>/dev/null | sort)

if [[ -z "$phase_files" ]]; then
    echo -e "${GREEN}No phase-*.md files found. Nothing to migrate.${NC}"
else
    echo "$phase_files" | while read -r phase_file; do
        ((PHASES_FOUND++))
        echo -e "\n${BLUE}Processing:${NC} $(basename "$phase_file")"
        
        # Get epic_id from phase frontmatter
        epic_id=$(get_frontmatter_value "$phase_file" "epic_id")
        
        if [[ -z "$epic_id" ]]; then
            echo -e "  ${RED}✗ No epic_id found in frontmatter. Skipping.${NC}"
            ((ERRORS++))
            continue
        fi
        
        # Find parent epic file
        epic_file=$(find "$MEMORY_DIR" -maxdepth 1 -name "epic-${epic_id}-*.md" -type f 2>/dev/null | head -1)
        
        if [[ -z "$epic_file" ]]; then
            echo -e "  ${RED}✗ Parent epic not found for epic_id: $epic_id. Skipping.${NC}"
            ((ERRORS++))
            continue
        fi
        
        echo -e "  ${GREEN}✓ Found parent epic:${NC} $(basename "$epic_file")"
        
        # Generate inline phase content
        phase_content=$(generate_inline_phase "$phase_file")
        
        echo -e "  ${YELLOW}→ Generated inline phase section${NC}"
        if $DRY_RUN; then
            echo -e "  ${BLUE}Preview:${NC}"
            echo "$phase_content" | sed 's/^/    /'
        fi
        
        # Append to epic
        append_phase_to_epic "$epic_file" "$phase_content"
        
        if ! $DRY_RUN; then
            # Remove the phase file
            echo -e "  ${YELLOW}→ Removing phase file${NC}"
            rm "$phase_file"
        fi
        
        ((PHASES_MIGRATED++))
        ((EPICS_UPDATED++))
        echo -e "  ${GREEN}✓ Phase migrated${NC}"
    done
fi

# Process story files to remove phase_id
echo -e "\n${BLUE}Scanning for story files with phase_id...${NC}"
story_files=$(find "$MEMORY_DIR" -maxdepth 1 -name "story-*.md" -type f 2>/dev/null | sort)

if [[ -n "$story_files" ]]; then
    echo "$story_files" | while read -r story_file; do
        remove_phase_id_from_story "$story_file"
    done
fi

# Also check archive
if [[ -d "$MEMORY_DIR/archive" ]]; then
    echo -e "\n${BLUE}Scanning archive for story files with phase_id...${NC}"
    archived_stories=$(find "$MEMORY_DIR/archive" -name "story-*.md" -type f 2>/dev/null | sort)
    
    if [[ -n "$archived_stories" ]]; then
        echo "$archived_stories" | while read -r story_file; do
            remove_phase_id_from_story "$story_file"
        done
    fi
fi

# Summary
echo -e "\n${BLUE}=== Migration Summary ===${NC}"
echo -e "Phase files found:      ${YELLOW}$PHASES_FOUND${NC}"
echo -e "Phases migrated:        ${GREEN}$PHASES_MIGRATED${NC}"
echo -e "Epics updated:          ${GREEN}$EPICS_UPDATED${NC}"
echo -e "Stories updated:        ${GREEN}$STORIES_UPDATED${NC}"
echo -e "Errors:                 ${RED}$ERRORS${NC}"

if $DRY_RUN; then
    echo -e "\n${YELLOW}This was a dry run. No changes were made.${NC}"
    echo -e "Run without --dry-run to apply changes."
else
    echo -e "\n${GREEN}Migration complete.${NC}"
    if [[ $PHASES_MIGRATED -gt 0 || $STORIES_UPDATED -gt 0 ]]; then
        echo -e "${YELLOW}Remember to commit the changes:${NC}"
        echo -e "  cd $MEMORY_DIR && git add -A && git commit -m 'refactor(memory): migrate phases to inline epic sections'"
    fi
fi
