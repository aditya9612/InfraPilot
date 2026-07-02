import re

file_page = 'e:/InfraPilot/InfraPilot/infrapilot-frontend/src/pages/labour/MyTasksPage.tsx'
with open(file_page, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update the list view action button to hide when status is 'Completed'
list_action_pattern = re.compile(
    r'\{/\* ACTION — View only \*/\}\s*<td className="px-6 py-5 whitespace-nowrap">.*?</td>',
    re.DOTALL
)

clean_list_action = """{/* ACTION — View only */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {task.status !== 'Completed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                        title="View Task Details"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </td>"""

text = list_action_pattern.sub(clean_list_action, text)

# 2. Update grid view Eye action button to hide when status is 'Completed'
grid_eye_pattern = re.compile(
    r'(<button\s*onClick=\{\(e\)\s*=>\s*\{\s*e\.stopPropagation\(\);\s*handleTaskClick\(task\);\s*\}\}\s*className="p-1\.5 text-slate-400 hover:text-indigo-600 transition-colors"\s*title="View Task Details"\s*>\s*<Eye className="w-4 h-4" />\s*</button>)',
    re.DOTALL
)

# We want to wrap the first group with task.status !== 'Completed'
clean_grid_eye = r"{task.status !== 'Completed' && (\n                                                    \1\n                                                )}"
text = grid_eye_pattern.sub(clean_grid_eye, text)

with open(file_page, 'w', encoding='utf-8') as f:
    f.write(text)

print("MyTasksPage action buttons updated successfully!")
