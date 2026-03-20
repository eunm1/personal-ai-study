export const POST_SELECT_FIELDS = {
  id: true,
  title: true,
  content: true,
  author: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { name: true } },
  analysis: {
    select: {
      summary: true,
      imageUrl: true,
      status: true,
      style: true,
    },
  },
};

export const POST_DEFAULT_STYLE = "Professional digital art style"